import config from 'config';
import { DataTypes, Op } from 'sequelize';

import { FhirResource } from './Resource';

import { latestDateTime } from '../../utils/dateTime';
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
import { Exception, formatFhirDate } from '../../utils/fhir';

export class FhirServiceRequest extends FhirResource {
  static init(options, models) {
    super.init(
      {
        identifier: DataTypes.JSONB,
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        intent: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        category: DataTypes.JSONB,
        priority: DataTypes.TEXT,
        code: DataTypes.JSONB,
        orderDetail: DataTypes.JSONB,
        subject: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        occurrenceDateTime: DataTypes.TEXT,
        requester: DataTypes.JSONB,
        locationCode: DataTypes.JSONB,
      },
      options,
    );

    this.UpstreamModel = models.ImagingRequest;
    this.upstreams = [
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.ImagingAreaExternalCode,
      models.Encounter,
      models.Facility,
      models.Location,
      models.LocationGroup,
      models.Patient,
      models.ReferenceData,
      models.User,
    ];
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
      occurrenceDateTime: formatFhirDate(upstream.requestedDate),
      requester: new FhirReference({
        display: upstream.requestedBy.displayName,
      }),
      locationCode: locationCode(upstream),
    });
  }

  static async queryToFindUpstreamIdsFromTable(table, id) {
    const {
      ImagingRequest,
      ImagingRequestArea,
      ImagingAreaExternalCode,
      Encounter,
      Facility,
      Location,
      LocationGroup,
      Patient,
      ReferenceData,
      User,
    } = this.sequelize.models;

    switch (table) {
      case ImagingRequest.tableName:
        return { where: { id } };
      case ImagingRequestArea.tableName:
        return {
          include: [
            {
              model: ImagingRequestArea,
              as: 'areas',
              where: { id },
            },
          ],
        };
      case Encounter.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              where: { id },
            },
          ],
        };
      case Facility.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: Location,
                  as: 'location',
                  include: [
                    {
                      model: Facility,
                      as: 'facility',
                      where: { id },
                    },
                  ],
                },
              ],
            },
          ],
        };
      case Location.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: Location,
                  as: 'location',
                  where: { id },
                },
              ],
            },
          ],
        };
      case LocationGroup.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: LocationGroup,
                  as: 'locationGroup',
                  where: { id },
                },
              ],
            },
          ],
        };
      case Patient.tableName:
        return {
          include: [
            {
              model: Encounter,
              as: 'encounter',
              include: [
                {
                  model: Patient,
                  as: 'patient',
                  where: { id },
                },
              ],
            },
          ],
        };
      case ReferenceData.tableName:
        return {
          include: [
            {
              model: ImagingRequestArea,
              as: 'areas',
              include: [
                {
                  model: ReferenceData,
                  as: 'area',
                  where: { id },
                },
              ],
            },
          ],
        };
      case ImagingAreaExternalCode.tableName:
        return {
          include: [
            {
              model: ImagingRequestArea,
              as: 'areas',
              include: [
                {
                  model: ReferenceData,
                  as: 'area',
                  include: [
                    {
                      model: ImagingAreaExternalCode,
                      as: 'imagingAreaExternalCode',
                      where: { id },
                    },
                  ],
                },
              ],
            },
          ],
        };
      case User.tableName:
        return {
          include: [
            {
              model: User,
              as: 'requestedBy',
            },
            {
              model: User,
              as: 'completedBy',
            },
          ],
          where: {
            [Op.or]: [{ '$requestedBy.id$': id }, { '$completedBy.id$': id }],
          },
        };
      default:
        return null;
    }
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
      subject: {
        type: FHIR_SEARCH_PARAMETERS.REFERENCE,
        path: [['subject']],
        referenceType: 'Patient',
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
