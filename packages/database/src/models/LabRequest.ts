import { DataTypes } from 'sequelize';
import { LAB_REQUEST_STATUSES, NOTIFICATION_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type ModelProperties, type Models } from '../types/model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import type { SessionConfig } from '../types/sync';
import type { LabTest } from './LabTest';
import type { ReferenceData } from './ReferenceData';
import type { Encounter } from './Encounter';
import type { User } from './User';
import type { Note } from './Note';
import type { LabTestPanelRequest } from './LabTestPanelRequest';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

interface LabRequestData {
  labTestTypeIds?: string[];
  labTestPanelId?: string;
  userId: string;
}

export class LabRequest extends Model {
  declare id: string;
  declare sampleTime?: string;
  declare requestedDate: string;
  declare specimenAttached: boolean;
  declare urgent: boolean;
  declare status: string;
  declare reasonForCancellation?: string;
  declare senaiteId?: string;
  declare sampleId?: string;
  declare displayId: string;
  declare publishedDate?: string;
  declare resultsInterpretation?: string;

  declare encounterId?: string;
  declare departmentId?: string;
  declare requestedById?: string;
  declare collectedById?: string;
  declare labTestCategoryId?: string;
  declare labSampleSiteId?: string;
  declare labTestPriorityId?: string;
  declare labTestLaboratoryId?: string;
  declare specimenTypeId?: string;
  declare labTestPanelRequestId?: string;
  declare priority?: ReferenceData;
  declare tests: LabTest[];
  declare encounter?: Encounter;
  declare requestedBy?: User;
  declare notes: Note[];
  declare labTestPanelRequest?: LabTestPanelRequest;

  static initModel({ primaryKey, ...options }: InitOptions, models: Models) {
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
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        urgent: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        },
        reasonForCancellation: {
          type: DataTypes.STRING,
        },
        senaiteId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sampleId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        displayId: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue() {
            return generateDisplayId();
          },
        },
        publishedDate: dateTimeType('publishedDate', {
          allowNull: true,
        }),
        resultsInterpretation: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterUpdate: async (labRequest: LabRequest, options) => {
            const previousStatus = labRequest.previous('status');
            const currentStatus = labRequest.status;
            const isStatusChanging = currentStatus !== previousStatus;

            if (!isStatusChanging) return;

            // Handle deletion first - if changing to DELETED or ENTERED_IN_ERROR,
            // delete all notifications and don't create new ones
            const shouldDeleteNotification = [
              LAB_REQUEST_STATUSES.DELETED,
              LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
            ].includes(currentStatus);

            if (shouldDeleteNotification) {
              await models.Notification.destroy({
                where: {
                  metadata: {
                    id: labRequest.id,
                  },
                },
                transaction: options.transaction,
              });
              return;
            }

            // Handle notification creation for status changes
            const isChangingFromPublished = previousStatus === LAB_REQUEST_STATUSES.PUBLISHED;
            const NOTIFICATION_STATUSES = [
              LAB_REQUEST_STATUSES.INTERIM_RESULTS,
              LAB_REQUEST_STATUSES.PUBLISHED,
              LAB_REQUEST_STATUSES.INVALIDATED,
            ];

            const shouldPushNotification = NOTIFICATION_STATUSES.includes(currentStatus) || isChangingFromPublished;

            if (shouldPushNotification) {
              await models.Notification.pushNotification(
                NOTIFICATION_TYPES.LAB_REQUEST,
                { ...labRequest.dataValues, previousStatus },
                { transaction: options.transaction },
              );
            }
          },
        },
      },
    );
  }

  static createWithTests(
    data: LabRequestData & ModelProperties<LabRequest> & { labTest: ModelProperties<LabTest> },
  ) {
    return this.sequelize!.transaction(async () => {
      const { labTestTypeIds = [] } = data;
      if (!labTestTypeIds.length) {
        throw new InvalidOperationError('A request must have at least one test');
      }
      const { LabTest, LabTestPanelRequest, LabRequestLog } = this.sequelize!.models;
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

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedLookupJoins(this),
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
