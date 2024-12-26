import { 
  DataTypes, 
  type Sequelize,
  type CreationOptional, 
  type ModelStatic, 
  type ModelAttributes as BaseModelAttributes, 
} from 'sequelize';
import { LAB_REQUEST_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import { buildSyncLookupSelect } from '@tamanu/shared/sync/buildSyncLookupSelect';

import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '@tamanu/shared/models/buildEncounterLinkedSyncFilter';
import { dateTimeType } from '@tamanu/shared/models/dateTimeTypes';
import { Model } from './Model';

interface LabRequestWithTests {
  departmentId: string;
  encounterId: string;
  requestedById: string;
  collectedById: string;
  labTestCategoryId: string;
  labTestPriorityId: string;
  labTestLaboratoryId: string;
  labSampleSiteId: string;
  specimenTypeId: string;
  labTestTypeIds: string[];
  urgent?: boolean;
  sampleTime?: string;
  requestedDate?: string;
  reasonForCancellation?: string;
  senaiteId?: string;
  sampleId?: string;
  displayId?: string;
  publishedDate?: string;
  userId: string;
  labTestPanelId?: string;
  labTest?: {
    date?: string;
  };
}

type ModelAttributes = BaseModelAttributes & {
  sequelize: Sequelize;
};

export class LabRequest extends Model {
  declare id: CreationOptional<string>;
  declare status: string;

  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
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
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, primaryKey, sequelize, ...options },
    );
  }

  static createWithTests(this: ModelStatic<LabRequest>, data: LabRequestWithTests) {
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

  static initRelations(this: ModelStatic<LabRequest>, models) {
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

  static getListReferenceAssociations(): (string | { association: string; include: string[] })[] {
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
