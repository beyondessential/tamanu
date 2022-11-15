import { DataTypes } from 'sequelize';
import { FhirResource } from './Resource';
import { arrayOf } from './utils';
import { dateTimeType } from '../dateTimeTypes';
import {
  FhirIdentifier,
  FhirCodeableConcept,
  FhirCoding,
  FhirReference,
} from '../../services/fhirTypes';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  FHIR_REQUEST_STATUS,
  FHIR_REQUEST_INTENT,
} from '../../constants';

export class FhirServiceRequest extends FhirResource {
  static init(options, models) {
    super.init(
      {
        // TODO: migration
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
        priority: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        code: {
          type: DataTypes.FHIR_CODEABLE_CONCEPT,
          allowNull: true,
        },
        orderDetail: arrayOf('orderDetail', DataTypes.FHIR_CODEABLE_CONCEPT),
        occurrenceDateTime: dateTimeType('occurrenceDateTime', { allowNull: true }),
        requester: {
          type: DataTypes.FHIR_REFERENCE,
          allowNull: true,
        },
        locationCode: arrayOf('locationCode', DataTypes.FHIR_CODEABLE_CONCEPT),
      },
      options,
    );

    this.UpstreamModel = models.ImagingRequest;
  }

  async updateMaterialisation() {
    const { Location, Facility, User, ImagingRequestAreas } = this.sequelize.models;

    const upstream = await this.getUpstream({
      include: [
        {
          model: User,
          as: 'requestedBy',
        },
        {
          model: ImagingRequestAreas,
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

    this.set({
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
      orderDetail: upstream.areas.map(
        area =>
          new FhirCodeableConcept({
            text: 'TBD', // TODO
            coding: [
              new FhirCoding({
                code: 'TBD', // TODO
                system: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
              }),
            ],
          }),
      ),
      occurrenceDateTime: upstream.requestedDate,
      requester: new FhirReference({
        display: upstream.requestedBy.displayName,
        type: 'Practitioner',
        // TODO: reference to Practitioner
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
