import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS, PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';

export class PortalSurveyAssignment extends Model {
  declare id: string;
  declare patientId: string;
  declare surveyId: string;
  declare facilityId: string;
  declare status: string;
  declare assignedAt: string;
  declare assignedById?: string;
  declare surveyResponseId?: string;

  forResponse() {
    return Object.assign({}, this.dataValues);
  }

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        patientId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        surveyId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'surveys',
            key: 'id',
          },
        },
        facilityId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        },
        assignedAt: dateTimeType('assignedAt', { allowNull: false }),
        assignedById: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        surveyResponseId: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'survey_responses',
            key: 'id',
          },
        },
      },
      {
        ...options,
        indexes: [{ fields: ['patientId', 'status'], name: 'idx_patient_id_status' }],
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      as: 'survey',
    });

    this.belongsTo(models.User, {
      foreignKey: 'assignedById',
      as: 'assignedBy',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'surveyResponseId',
      as: 'surveyResponse',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
