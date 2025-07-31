import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS, PATIENT_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { Model } from './Model';

export class PatientSurveyAssignment extends Model {
  declare id: string;
  declare patientId: string;
  declare surveyId: string;
  declare status: string;
  declare assignedAt: string;
  declare completedAt?: string;
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
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: PATIENT_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        },
        assignedAt: dateTimeType('assignedAt'),
        completedAt: dateTimeType('completedAt'),
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
  }

  static buildPatientSyncFilter() {
    return null;
  }

  static buildSyncLookupQueryDetails() {
    return null;
  }
}
