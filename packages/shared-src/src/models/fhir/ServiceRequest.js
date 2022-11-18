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
  FHIR_REQUEST_STATUS,
  FHIR_REQUEST_INTENT,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  IMAGING_REQUEST_STATUS_TYPES,
} from '../../constants';

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
        ...areaExtCodes.map(ext => ext.updatedAt),
      ),
      identifier: [
        new FhirIdentifier({
          system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
          value: upstream.id,
        }),
      ],
      status: {
        [IMAGING_REQUEST_STATUS_TYPES.PENDING]: FHIR_REQUEST_STATUS.DRAFT,
        [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: FHIR_REQUEST_STATUS.ACTIVE,
        [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: FHIR_REQUEST_STATUS.COMPLETED,
      }[upstream.status],
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
      priority: upstream.priority, // assumes that the values are FHIR compatible
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
                    system: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
                  }),
                ],
              }),
            ]
          : [],
      ),
      subject: new FhirReference({
        type: 'upstream://patient',
        reference: upstream.encounter.patient.id,
        display: upstream.encounter.patient.displayName,
      }),
      occurrenceDateTime: dateTimeStringIntoCountryTimezone(upstream.requestedDate),
      requester: new FhirReference({
        display: upstream.requestedBy.displayName,
      }),
      locationCode: upstream.location?.facility?.name
        ? [
            new FhirCodeableConcept({
              text: upstream.location.facility.name,
            }),
          ]
        : [],
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
        path: [['category', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      code: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['code']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
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
