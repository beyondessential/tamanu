import config from 'config';
import { DataTypes } from 'sequelize';

import { FhirResource } from './Resource';
import { arrayOf } from './utils';

import { latestDateTime, dateTimeStringIntoCountryTimezone } from '../../utils/dateTime';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirIdentifier,
  FhirReference,
} from '../../services/fhirTypes';
import {
  FHIR_INTERACTIONS,
  FHIR_REQUEST_INTENT,
  FHIR_REQUEST_PRIORITY,
  FHIR_REQUEST_STATUS,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  IMAGING_REQUEST_STATUS_TYPES,
} from '../../constants';
import { Exception } from '../../utils/fhir';

export class FhirServiceRequest extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: arrayOf('identifier', DataTypes.FHIR_IDENTIFIER),
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        intent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        category: arrayOf('category', DataTypes.FHIR_CODEABLE_CONCEPT),
        priority: DataTypes.TEXT,
        code: DataTypes.FHIR_CODEABLE_CONCEPT,
        orderDetail: arrayOf('orderDetail', DataTypes.FHIR_CODEABLE_CONCEPT),
        subject: {
          type: DataTypes.FHIR_REFERENCE,
          allowNull: false,
        },
        occurrenceDateTime: DataTypes.DATE,
        requester: DataTypes.FHIR_REFERENCE,
        locationCode: arrayOf('locationCode', DataTypes.FHIR_CODEABLE_CONCEPT),
      },
      options,
    );

    this.UpstreamModel = models.ImagingRequest;
  }

  static CAN_DO = new Set([
    FHIR_INTERACTIONS.INSTANCE.READ,
    FHIR_INTERACTIONS.TYPE.SEARCH,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  ]);

  async updateMaterialisation() {
    const {
      Encounter,
      Facility,
      ImagingAreaExternalCode,
      Location,
      Patient,
      ReferenceData,
      User,
    } = this.sequelize.models;

    const upstream = await this.getUpstream({
      include: [
        {
          model: User,
          as: 'requestedBy',
        },
        {
          model: Encounter,
          as: 'encounter',
          include: [
            {
              model: Patient,
              as: 'patient',
            },
            {
              model: Location,
              as: 'location',
              include: [
                {
                  model: Facility,
                  as: 'facility',
                },
              ],
            },
          ],
        },
        {
          model: ReferenceData,
          as: 'areas',
        },
        {
          model: Location,
          as: 'location',
          include: [
            {
              model: Facility,
              as: 'facility',
            },
          ],
        },
      ],
    });

    const areaExtCodes = new Map(
      (
        await ImagingAreaExternalCode.findAll({
          where: {
            areaId: upstream.areas.map(area => area.id),
          },
        })
      ).map(ext => [
        ext.areaId,
        { code: ext.code, description: ext.description, updatedAt: ext.updatedAt },
      ]),
    );

    this.set({
      lastUpdated: latestDateTime(
        upstream.updatedAt,
        upstream.requestedBy?.updatedAt,
        upstream.encounter?.updatedAt,
        upstream.encounter?.patient?.updatedAt,
        upstream.location?.updatedAt,
        upstream.location?.facility?.updatedAt,
        ...upstream.areas.map(area => area.updatedAt),
        ...[...areaExtCodes.values()].map(ext => ext.updatedAt),
      ),
      identifier: [
        new FhirIdentifier({
          system: config.hl7.dataDictionaries.serviceRequestId,
          value: upstream.id,
        }),
        new FhirIdentifier({
          system: config.hl7.dataDictionaries.serviceRequestDisplayId,
          value: upstream.displayId,
        }),
      ],
      status: status(upstream),
      intent: FHIR_REQUEST_INTENT.ORDER._,
      category: [
        new FhirCodeableConcept({
          coding: [
            new FhirCoding({
              system: 'http://snomed.info/sct',
              code: '363679005',
            }),
          ],
        }),
      ],
      priority: validatePriority(upstream.priority),
      code: imagingCode(upstream)
        ? new FhirCodeableConcept({
            text: imagingCode(upstream),
          })
        : null,
      orderDetail: upstream.areas.flatMap(({ id }) =>
        areaExtCodes.has(id)
          ? [
              new FhirCodeableConcept({
                text: areaExtCodes.get(id)?.description,
                coding: [
                  new FhirCoding({
                    code: areaExtCodes.get(id)?.code,
                    system: config.hl7.dataDictionaries.areaExternalCode,
                  }),
                ],
              }),
            ]
          : [],
      ),
      subject: new FhirReference({
        type: 'upstream://patient',
        reference: upstream.encounter.patient.id,
        display: `${upstream.encounter.patient.firstName} ${upstream.encounter.patient.lastName}`,
      }),
      occurrenceDateTime: dateTimeStringIntoCountryTimezone(upstream.requestedDate),
      requester: new FhirReference({
        display: upstream.requestedBy.displayName,
      }),
      locationCode: locationCode(upstream),
    });
  }

  static searchParameters() {
    return {
      ...super.searchParameters(),
      identifier: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['identifier', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      category: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['category', '[]', 'coding', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
      },
      intent: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['intent']],
      },
      occurrence: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['occurrenceDateTime']],
      },
      priority: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['priority']],
      },
      status: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [['status']],
      },
    };
  }
}

function imagingCode(upstream) {
  for (const { id } of upstream.areas) {
    if (id === 'ctScan') {
      return 'CT Scan';
    }

    if (id.startsWith('xRay')) {
      return 'X-Ray';
    }
  }

  return null;
}

function validatePriority(priority) {
  if (!priority) {
    // default to routine when we don't have a priority in Tamanu
    return FHIR_REQUEST_PRIORITY.ROUTINE;
  }

  if (!Object.values(FHIR_REQUEST_PRIORITY).includes(priority)) {
    throw new Exception(`Invalid priority: ${priority}`);
  }

  return priority;
}

function locationCode(upstream) {
  const facility =
    upstream.locationGroup?.facility ?? // most accurate
    upstream.location?.facility ?? // legacy data
    upstream.encounter?.location?.facility; // fallback to encounter
  if (!facility) return [];

  return [
    new FhirCodeableConcept({
      text: facility.name,
    }),
  ];
}

function status(upstream) {
  return (
    {
      [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: FHIR_REQUEST_STATUS.REVOKED,
      [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: FHIR_REQUEST_STATUS.COMPLETED,
      [IMAGING_REQUEST_STATUS_TYPES.DELETED]: FHIR_REQUEST_STATUS.REVOKED,
      [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: FHIR_REQUEST_STATUS.ENTERED_IN_ERROR,
      [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: FHIR_REQUEST_STATUS.ACTIVE,
      [IMAGING_REQUEST_STATUS_TYPES.PENDING]: FHIR_REQUEST_STATUS.DRAFT,
    }[upstream.status] ?? FHIR_REQUEST_STATUS.UNKNOWN
  );
}
