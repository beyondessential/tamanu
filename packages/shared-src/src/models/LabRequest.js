import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';

import { LAB_REQUEST_STATUSES, SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class LabRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        sampleTime: dateTimeType('sampleTime', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        requestedDate: dateTimeType('requestedDate', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        specimenAttached: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        urgent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        status: {
          type: Sequelize.STRING,
          defaultValue: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        },
        reasonForCancellation: {
          type: Sequelize.STRING,
        },
        senaiteId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        sampleId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        displayId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        publishedDate: dateTimeType('publishedDate', {
          allowNull: true,
        }),
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static createWithTests(data) {
    return this.sequelize.transaction(async () => {
      const { labTestTypeIds = [] } = data;
      if (!labTestTypeIds.length) {
        throw new InvalidOperationError('A request must have at least one test');
      }

      const { date, ...requestData } = data;

      const base = await this.create(requestData);

      // then create tests
      const { LabTest } = this.sequelize.models;

      await Promise.all(
        labTestTypeIds.map(t =>
          LabTest.create({
            labTestTypeId: t,
            labRequestId: base.id,
            date,
          }),
        ),
      );

      return base;
    });
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'requestedById',
      as: 'requestedBy',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestCategoryId',
      as: 'category',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestPriorityId',
      as: 'priority',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestLaboratoryId',
      as: 'laboratory',
    });

    this.hasMany(models.LabTest, {
      foreignKey: 'labRequestId',
      as: 'tests',
    });

    this.hasMany(models.CertificateNotification, {
      foreignKey: 'labRequestId',
      as: 'certificate_notification',
    });

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static getListReferenceAssociations() {
    return [
      'requestedBy',
      'category',
      'priority',
      'laboratory',
      { association: 'tests', include: ['labTestType'] },
    ];
  }

  static buildSyncFilter(patientIds, sessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab requests
    }
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }

  getTests() {
    return this.sequelize.models.LabTest.findAll({
      where: { labRequestId: this.id },
    });
  }
}
