import { DataTypes } from 'sequelize';
import { LAB_REQUEST_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import {
  dateTimeType,
  type InitOptions,
  type ModelProperties,
  type Models,
} from '../../types/model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import type { SessionConfig } from '../../types/sync';
import type { LabTest } from '../LabTest';
import type { ReferenceData } from '../ReferenceData';
import type { Encounter } from '../Encounter';
import type { User } from '../User';
import type { Note } from '../Note';
import type { LabTestPanelRequest } from '../LabTestPanelRequest';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';
import { afterCreateHook, afterDestroyHook, afterUpdateHook } from './hooks';

interface LabRequestPanelInput {
  labTestPanelId: string;
  labTestTypeIds: string[];
}

interface LabRequestData {
  labTestTypeIds?: string[];
  panels?: LabRequestPanelInput[];
  // Deprecated single-panel form, kept for callers that create a one-panel request directly.
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
  declare priority?: ReferenceData;
  declare category?: ReferenceData;
  declare tests: LabTest[];
  declare encounter?: Encounter;
  declare requestedBy?: User;
  declare notes: Note[];
  declare labTestPanelRequests?: LabTestPanelRequest[];

  static initModel({ primaryKey, ...options }: InitOptions) {
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
          afterUpdate: afterUpdateHook,
          afterCreate: afterCreateHook,
          afterDestroy: afterDestroyHook,
        },
      },
    );
  }

  static createWithTests(
    data: LabRequestData & ModelProperties<LabRequest> & { labTest: ModelProperties<LabTest> },
  ) {
    return this.sequelize!.transaction(async () => {
      const { LabTest, LabTestPanelRequest, LabRequestLog } = this.sequelize!.models;
      const {
        labTest,
        labTestPanelId,
        panels: panelsInput,
        labTestTypeIds = [],
        userId,
        ...requestData
      } = data;

      // A request can hold several panels plus loose individual tests from one category. The
      // deprecated single-panel form maps to one panel whose members are labTestTypeIds.
      const panels =
        panelsInput ?? (labTestPanelId ? [{ labTestPanelId, labTestTypeIds }] : []);
      const individualTestTypeIds = labTestPanelId && !panelsInput ? [] : labTestTypeIds;

      const panelTestCount = panels.reduce((total, panel) => total + panel.labTestTypeIds.length, 0);
      if (individualTestTypeIds.length + panelTestCount === 0) {
        throw new InvalidOperationError('A request must have at least one test');
      }

      const newLabRequest = await this.create(requestData);

      await LabRequestLog.create({
        status: newLabRequest.status,
        labRequestId: newLabRequest.id,
        updatedById: userId,
      });

      // Individual tests carry no panel attribution. Skip each row's invoicing hook here and
      // resolve the whole request once below, so bulk creation stays linear.
      await Promise.all(
        individualTestTypeIds.map(labTestTypeId =>
          LabTest.create(
            {
              labTestTypeId,
              labRequestId: newLabRequest.id,
              date: labTest?.date,
            },
            { hooks: false },
          ),
        ),
      );

      // Each ordered panel becomes a panel request on this lab request, and its member tests are
      // attributed to it. A test type shared by two panels gets one row per panel.
      for (const panel of panels) {
        const panelRequest = await LabTestPanelRequest.create(
          {
            encounterId: newLabRequest.encounterId,
            labTestPanelId: panel.labTestPanelId,
            labRequestId: newLabRequest.id,
          },
          { hooks: false },
        );
        await Promise.all(
          panel.labTestTypeIds.map(labTestTypeId =>
            LabTest.create(
              {
                labTestTypeId,
                labRequestId: newLabRequest.id,
                labTestPanelRequestId: panelRequest.id,
                date: labTest?.date,
              },
              { hooks: false },
            ),
          ),
        );
      }

      // Every panel request and test now exists; resolve invoicing once instead of from each
      // row's suppressed afterCreate hook.
      await afterCreateHook(newLabRequest);

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

    this.hasMany(models.LabTestPanelRequest, {
      foreignKey: 'labRequestId',
      as: 'labTestPanelRequests',
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
      { association: 'labTestPanelRequests', include: ['labTestPanel'] },
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
