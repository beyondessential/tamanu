import { DataTypes } from 'sequelize';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirResource } from '../Resource';

import { fromEncounters } from '../Encounter/getQueryToFindUpstreamIds';
import { filterFromEncounters } from '../Encounter/getQueryToFilterUpstream';
import { getMaterialisedValues } from './getMaterialisedValues';

export class MediciReport extends FhirResource {
  static init(options, models) {
    super.init(
      {
        patientId: DataTypes.TEXT,
        firstName: DataTypes.TEXT,
        lastName: DataTypes.TEXT,
        dateOfBirth: DataTypes.TEXT,
        sex: DataTypes.TEXT,
        patientBillingType: DataTypes.TEXT,
        encounterId: DataTypes.UUID,
        encounterStartDate: DataTypes.DATE,
        encounterEndDate: DataTypes.DATE,
        dischargeDate: DataTypes.DATE,
        encounterType: DataTypes.JSONB,
        weight: DataTypes.TEXT,
        visitType: DataTypes.TEXT,
        episodeEndStatus: DataTypes.JSONB,
        waitTime: DataTypes.TEXT,
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
      models.ImagingRequest,
      models.ImagingRequestArea,
      models.ImagingAreaExternalCode,
      models.Encounter,
      models.LabRequest,
      models.LabTest,
      models.LabTestType,
      models.LabTestPanelRequest,
      models.LabTestPanel,
      models.AdministeredVaccine,
      models.Discharge,
      models.DocumentMetadata,
      models.EncounterDiagnosis,
      models.EncounterMedication,
      models.Invoice,
      models.Procedure,
      models.SurveyResponse,
      models.Triage,
      models.Vitals,
      models.Note,
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

  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id, deletedRow = null) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return fromEncounters(this.sequelize.models, table, id, deletedRow);
    }
    return null;
  }

  static async queryToFilterUpstream(upstreamTable) {
    const { Encounter } = this.sequelize.models;

    if (upstreamTable === Encounter.tableName) {
      return filterFromEncounters(this.sequelize.models, upstreamTable);
    }

    return null;
  }
}
