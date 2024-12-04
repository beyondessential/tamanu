import { Sequelize } from 'sequelize';
import { LAB_REQUEST_STATUSES, NOTIFICATION_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { generateDisplayId } from '../utils/generateDisplayId';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class LabRequest extends Model {
  static init({ primaryKey, ...options }, models) {
    super.init(
      {
        id: primaryKey,
        sampleTime: dateTimeType('sampleTime', {
          allowNull: true,
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
          defaultValue() {
            return generateDisplayId();
          },
        },
        publishedDate: dateTimeType('publishedDate', {
          allowNull: true,
        }),
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        ...options,
        hooks: {
          afterUpdate: async labRequest => {
            const shouldPushNotification = [
              LAB_REQUEST_STATUSES.INTERIM_RESULTS,
              LAB_REQUEST_STATUSES.PUBLISHED,
              LAB_REQUEST_STATUSES.INVALIDATED,
            ].includes(labRequest.status);

            if (shouldPushNotification && labRequest.status !== labRequest.previous('status')) {
              await models.Notification.pushNotification(
                NOTIFICATION_TYPES.LAB_REQUEST,
                labRequest.dataValues,
              );
            }

            const shouldDeleteNotification = [
              LAB_REQUEST_STATUSES.DELETED,
              LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
            ].includes(labRequest.status);

            if (shouldDeleteNotification && labRequest.status !== labRequest.previous('status')) {
              await models.Notification.destroy({
                where: {
                  metadata: {
                    id: labRequest.id,
                  },
                },
              });
            }
          },
        },
      },
    );
  }

  static createWithTests(data) {
    return this.sequelize.transaction(async () => {
      const { labTestTypeIds = [] } = data;
      if (!labTestTypeIds.length) {
        throw new InvalidOperationError('A request must have at least one test');
      }
      const { LabTest, LabTestPanelRequest, LabRequestLog } = this.sequelize.models;
      const { labTest, labTestPanelId, userId, ...requestData } = data;
      let newLabRequest;

      if (labTestPanelId) {
        const { id: labTestPanelRequestId } = await LabTestPanelRequest.create({
          encounterId: data.encounterId,
          labTestPanelId,
        });
        newLabRequest = await this.create({ ...requestData, labTestPanelRequestId });
      } else {
        newLabRequest = await this.create(requestData);
      }

      await LabRequestLog.create({
        status: newLabRequest.status,
        labRequestId: newLabRequest.id,
        updatedById: userId,
      });

      // then create tests
      await Promise.all(
        labTestTypeIds.map(t =>
          LabTest.create({
            labTestTypeId: t,
            labRequestId: newLabRequest.id,
            date: labTest?.date,
          }),
        ),
      );

      return newLabRequest;
    });
  }

  static initRelations(models) {
    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });

    this.belongsTo(models.User, {
      foreignKey: 'collectedById',
      as: 'collectedBy',
    });

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
      foreignKey: 'labSampleSiteId',
      as: 'site',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestPriorityId',
      as: 'priority',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestLaboratoryId',
      as: 'laboratory',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'specimenTypeId',
      as: 'specimenType',
    });

    this.belongsTo(models.LabTestPanelRequest, {
      foreignKey: 'labTestPanelRequestId',
      as: 'labTestPanelRequest',
    });

    this.hasMany(models.LabTest, {
      foreignKey: 'labRequestId',
      as: 'tests',
    });

    this.hasMany(models.CertificateNotification, {
      foreignKey: 'labRequestId',
      as: 'certificate_notification',
    });

    this.hasMany(models.LabRequestAttachment, {
      foreignKey: 'labRequestId',
      as: 'labRequestAttachments',
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

  static getListReferenceAssociations() {
    return [
      'department',
      'requestedBy',
      'category',
      'priority',
      'laboratory',
      'site',
      'collectedBy',
      'specimenType',
      { association: 'labTestPanelRequest', include: ['labTestPanel'] },
      { association: 'tests', include: ['labTestType'] },
    ];
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable, sessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab requests
    }
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        encounterId: `${this.tableName}.encounter_id`,
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
    };
  }

  getTests() {
    return this.sequelize.models.LabTest.findAll({
      where: { labRequestId: this.id },
    });
  }

  getLatestAttachment() {
    return this.sequelize.models.LabRequestAttachment.findOne({
      where: {
        labRequestId: this.id,
        replacedById: null,
      },
    });
  }
}
