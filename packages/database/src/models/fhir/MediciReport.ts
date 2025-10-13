import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from './Resource';

import type { InitOptions, Models } from '../../types/model';
import {
  filterFromEncounters,
  fromEncounters,
  getMaterialisedValues,
} from '../../utils/fhir/MediciReport';

export class MediciReport extends FhirResource {
  declare patientId: string;
  declare firstName: string;
  declare lastName: string;
  declare dateOfBirth?: string;
  declare sex: string;
  declare patientBillingId?: string;
  declare patientBillingType?: string;
  declare encounterId: string;
  declare age?: number;
  declare encounterStartDate: string;
  declare encounterEndDate?: string;
  declare dischargeDate?: string;
  declare encounterType?: Record<string, any>;
  declare weight?: number;
  declare visitType: string;
  declare triageCategory?: string;
  declare episodeEndStatus?: Record<string, any>;
  declare encounterDischargeDisposition?: Record<string, any>;
  declare waitTime?: string;
  declare departments?: Record<string, any>;
  declare locations?: Record<string, any>;
  declare reasonForEncounter?: string;
  declare diagnoses?: Record<string, any>;
  declare medications?: Record<string, any>;
  declare vaccinations?: Record<string, any>;
  declare procedures?: Record<string, any>;
  declare labRequests?: Record<string, any>;
  declare imagingRequests?: Record<string, any>;
  declare notes?: Record<string, any>;

  static initModel(options: InitOptions, models: Models) {
    super.initResource(
      {
        patientId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        firstName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        dateOfBirth: DataTypes.STRING,
        sex: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        patientBillingId: DataTypes.STRING,
        patientBillingType: DataTypes.TEXT,
        encounterId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        age: DataTypes.INTEGER,
        encounterStartDate: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        encounterEndDate: DataTypes.STRING,
        dischargeDate: DataTypes.STRING,
        encounterType: DataTypes.JSONB,
        weight: DataTypes.DECIMAL,
        visitType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        triageCategory: DataTypes.TEXT,
        episodeEndStatus: DataTypes.JSONB,
        encounterDischargeDisposition: DataTypes.JSONB,
        waitTime: DataTypes.STRING,
        departments: DataTypes.JSONB,
        locations: DataTypes.JSONB,
        reasonForEncounter: DataTypes.TEXT,
        diagnoses: DataTypes.JSONB,
        medications: DataTypes.JSONB,
        vaccinations: DataTypes.JSONB,
        procedures: DataTypes.JSONB,
        labRequests: DataTypes.JSONB,
        imagingRequests: DataTypes.JSONB,
        notes: DataTypes.JSONB,
      },
      {
        ...options,
        tableName: 'non_fhir_medici_report',
      },
    );

    this.UpstreamModels = [models.Encounter];
    this.upstreams = [
      models.Patient,
      models.PatientBirthData,
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.Encounter,
      // EncounterHistory model removed - now using logs.changes for encounter change tracking
      models.LabRequest,
      models.LabTest,
      models.LabTestType,
      models.AdministeredVaccine,
      models.ScheduledVaccine,
      models.Discharge,
      models.EncounterDiagnosis,
      models.Prescription,
      models.Procedure,
      models.Triage,
      models.Note,
      models.Department,
      models.Location,
      models.LocationGroup,
    ];
  }

  static get fhirName() {
    return this.name; // this is not FHIR
  }

  static CAN_DO = new Set([FHIR_INTERACTIONS.INTERNAL.MATERIALISE]);

  async updateMaterialisation() {
    const materialisedValues = await getMaterialisedValues(this.sequelize, this.upstreamId);
    this.set({ ...materialisedValues, resolved: true });
  }

  static async queryToFilterUpstream(upstreamTable: string) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return filterFromEncounters(this.sequelize.models, upstreamTable);
    }

    return null;
  }

  static async queryToFindUpstreamIdsFromTable(
    upstreamTable: string,
    table: string,
    id: string,
    deletedRow = null,
  ) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return fromEncounters(this.sequelize.models, table, id, deletedRow);
    }

    return null;
  }
}
