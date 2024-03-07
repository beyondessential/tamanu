import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from '../Resource';

import { fromEncounters } from './getQueryToFindUpstreamIds';
import { getMaterialisedValues } from './getMaterialisedValues';
import { filterFromEncounters } from './filterFromEncounters';

export class MediciReport extends FhirResource {
  static init(options, models) {
    super.init(
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
      models.EncounterHistory,
      models.LabRequest,
      models.LabTest,
      models.LabTestType,
      models.AdministeredVaccine,
      models.ScheduledVaccine,
      models.Discharge,
      models.EncounterDiagnosis,
      models.EncounterMedication,
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
    this.set({ ...materialisedValues });
  }

  static async queryToFilterUpstream(upstreamTable) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return filterFromEncounters(this.sequelize.models, upstreamTable);
    }

    return null;
  }

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id, deletedRow = null) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return fromEncounters(this.sequelize.models, table, id, deletedRow);
    }

    return null;
  }
}
