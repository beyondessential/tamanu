import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildEncounterLinkedLookupSelect } from '../sync/buildEncounterLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';
import type { Prescription } from './Prescription';
import { Op } from 'sequelize';

export class PatientOngoingPrescription extends Model {
  declare id: string;
  declare patientId?: string;
  declare prescriptionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        patientId: 'COALESCE(encounters.patient_id, patient_ongoing_prescriptions.patient_id)',
      }),
      joins: `
        LEFT JOIN encounter_prescriptions ON patient_ongoing_prescriptions.prescription_id = encounter_prescriptions.prescription_id
        LEFT JOIN encounters ON encounter_prescriptions.encounter_id = encounters.id
        LEFT JOIN locations ON encounters.location_id = locations.id
        LEFT JOIN facilities ON locations.facility_id = facilities.id
      `,
    };
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;

  static findPatientOngoingPrescriptionWithSameDetails(
    patientId: string,
    prescription: Prescription,
  ) {
    const { models } = this.sequelize;

    return this.findOne({
      where: {
        patientId: patientId,
      },
      include: [
        {
          model: models.Prescription,
          as: 'prescription',
          where: {
            medicationId: prescription.medicationId,
            doseAmount: prescription.doseAmount,
            units: prescription.units,
            route: prescription.route,
            frequency: prescription.frequency,
            discontinued: {
              [Op.not]: true,
            },
          },
        },
      ],
    });
  }
}
