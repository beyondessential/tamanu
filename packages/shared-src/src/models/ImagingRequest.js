import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';
import { IMAGING_REQUEST_STATUS_TYPES, IMAGING_TYPES } from 'shared/constants';

import { Model } from './Model';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);
const ALL_IMAGING_TYPES = Object.values(IMAGING_TYPES);
export class ImagingRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        imagingType: {
          type: Sequelize.ENUM(ALL_IMAGING_TYPES),
          allowNull: false,
        },

        status: {
          type: Sequelize.ENUM(ALL_IMAGING_REQUEST_STATUS_TYPES),
          allowNull: false,
          defaultValue: IMAGING_REQUEST_STATUS_TYPES.PENDING,
        },

        requestedDate: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },

        results: {
          type: Sequelize.STRING,
          defaultValue: '',
        },

        urgent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        ...options,
        validate: {
          mustHaveValidRequestStatusType() {
            if (!ALL_IMAGING_REQUEST_STATUS_TYPES.includes(this.status)) {
              throw new InvalidOperationError('An imaging request must have a valid status.');
            }
          },
          mustHaveValidRequester() {
            if (!this.requestedById) {
              throw new InvalidOperationError('An imaging request must have a valid requester.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['requestedBy', 'areas'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.User, {
      foreignKey: 'requestedById',
      as: 'requestedBy',
    });

    this.belongsTo(models.User, {
      foreignKey: 'completedById',
      as: 'completedBy',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsToMany(models.ReferenceData, {
      through: models.ImagingRequestAreas,
      as: 'areas',
      foreignKey: 'imagingRequestId',
    });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }
}
