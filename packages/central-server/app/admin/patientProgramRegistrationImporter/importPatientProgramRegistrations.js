import { utils } from 'xlsx';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import { statkey, updateStat } from '../stats';
import { ValidationError, WorkSheetError } from '../errors';

const VALID_REGISTRATION_STATUSES = new Set(Object.values(REGISTRATION_STATUSES));

const SHEET_NAME = 'ppr';

function convertExcelDate(value) {
  if (value == null || value === '') return undefined;
  return toDateTimeString(getJsDateFromExcel(value));
}

function trimRow(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key.trim(),
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
}

function parseCommaSeparated(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function validateForeignKey(models, modelName, id, fieldLabel) {
  if (!id) return;
  const record = await models[modelName].findByPk(id);
  if (!record) {
    throw new Error(`${fieldLabel} "${id}" does not exist`);
  }
}

export async function importPatientProgramRegistrations(workbook, { errors, log, models }) {
  const stats = {};
  const sheet = workbook.Sheets[SHEET_NAME];

  if (!sheet) {
    throw new Error(`Workbook must have a sheet named "${SHEET_NAME}"`);
  }

  let sheetRows;
  try {
    sheetRows = utils.sheet_to_json(sheet);
  } catch (err) {
    throw new WorkSheetError(SHEET_NAME, 0, err);
  }

  if (sheetRows.length === 0) {
    throw new Error(`Sheet "${SHEET_NAME}" is empty`);
  }

  log.debug(`Processing ${sheetRows.length} rows from ${SHEET_NAME}`);

  for (const [sheetRow, data] of sheetRows.entries()) {
    const trimmed = trimRow(data);
    const {
      date,
      registration_status: registrationStatus,
      patient_display_id: patientDisplayId,
      program_registry_id: programRegistryId,
      clinical_status_id: clinicalStatusId,
      clinician_id: clinicianId,
      registering_facility_id: registeringFacilityId,
      deactivated_clinician_id: deactivatedClinicianId,
      deactivated_date: deactivatedDate,
      program_registry_condition_ids: rawConditionIds,
      program_registry_condition_category_id: conditionCategoryId,
    } = trimmed;

    try {
      const rowErrors = [];

      // Validate required fields
      if (!patientDisplayId) rowErrors.push(new Error('patient_display_id is required'));
      if (!programRegistryId) rowErrors.push(new Error('program_registry_id is required'));
      if (!clinicianId) rowErrors.push(new Error('clinician_id is required'));
      if (!date) rowErrors.push(new Error('date is required'));

      if (registrationStatus && !VALID_REGISTRATION_STATUSES.has(registrationStatus)) {
        rowErrors.push(
          new Error(
            `registration_status "${registrationStatus}" is invalid, must be one of: ${[...VALID_REGISTRATION_STATUSES].join(', ')}`,
          ),
        );
      }

      const conditionIds = parseCommaSeparated(rawConditionIds);
      if (conditionIds.length > 0 && !conditionCategoryId) {
        rowErrors.push(
          new Error(
            'program_registry_condition_category_id is required when program_registry_condition_ids are provided',
          ),
        );
      }

      if (rowErrors.length) throw rowErrors;

      // Resolve patient_display_id to patient_id
      const patient = await models.Patient.findOne({ where: { displayId: patientDisplayId } });
      if (!patient) {
        throw [new Error(`Patient with display ID "${patientDisplayId}" does not exist`)];
      }

      // Validate FK references
      const fkErrors = [];
      const fkChecks = [
        validateForeignKey(
          models,
          'ProgramRegistry',
          programRegistryId,
          'program_registry_id',
        ).catch(e => fkErrors.push(e)),
        validateForeignKey(models, 'User', clinicianId, 'clinician_id').catch(e =>
          fkErrors.push(e),
        ),
      ];

      if (clinicalStatusId) {
        fkChecks.push(
          validateForeignKey(
            models,
            'ProgramRegistryClinicalStatus',
            clinicalStatusId,
            'clinical_status_id',
          ).catch(e => fkErrors.push(e)),
        );
      }
      if (registeringFacilityId) {
        fkChecks.push(
          validateForeignKey(
            models,
            'Facility',
            registeringFacilityId,
            'registering_facility_id',
          ).catch(e => fkErrors.push(e)),
        );
      }
      if (deactivatedClinicianId) {
        fkChecks.push(
          validateForeignKey(
            models,
            'User',
            deactivatedClinicianId,
            'deactivated_clinician_id',
          ).catch(e => fkErrors.push(e)),
        );
      }
      if (conditionCategoryId) {
        fkChecks.push(
          validateForeignKey(
            models,
            'ProgramRegistryConditionCategory',
            conditionCategoryId,
            'program_registry_condition_category_id',
          ).catch(e => fkErrors.push(e)),
        );
      }
      for (const conditionId of conditionIds) {
        fkChecks.push(
          validateForeignKey(
            models,
            'ProgramRegistryCondition',
            conditionId,
            'program_registry_condition_ids',
          ).catch(e => fkErrors.push(e)),
        );
      }

      await Promise.all(fkChecks);
      if (fkErrors.length) throw fkErrors;

      // Convert dates
      const dateString = convertExcelDate(date);
      const deactivatedDateString = deactivatedDate ? convertExcelDate(deactivatedDate) : undefined;

      // Check existence before upsert: Postgres doesn't return created/updated info from upsert
      const existingRegistration = await models.PatientProgramRegistration.findOne({
        where: { patientId: patient.id, programRegistryId },
      });

      const [registration] = await models.PatientProgramRegistration.upsert({
        patientId: patient.id,
        programRegistryId,
        date: dateString,
        ...(registrationStatus && { registrationStatus }),
        clinicianId,
        ...(clinicalStatusId && { clinicalStatusId }),
        ...(registeringFacilityId && { registeringFacilityId }),
        ...(deactivatedClinicianId && { deactivatedClinicianId }),
        ...(deactivatedDateString && { deactivatedDate: deactivatedDateString }),
      });

      updateStat(
        stats,
        statkey('PatientProgramRegistration', SHEET_NAME),
        existingRegistration ? 'updated' : 'created',
      );

      // Replace condition records: delete existing ones then re-create from spreadsheet
      if (conditionIds.length > 0) {
        await models.PatientProgramRegistrationCondition.destroy({
          where: { patientProgramRegistrationId: registration.id },
        });

        for (const conditionId of conditionIds) {
          try {
            await models.PatientProgramRegistrationCondition.create({
              patientProgramRegistrationId: registration.id,
              programRegistryConditionId: conditionId,
              programRegistryConditionCategoryId: conditionCategoryId,
              date: dateString,
              clinicianId,
            });

            updateStat(
              stats,
              statkey('PatientProgramRegistrationCondition', SHEET_NAME),
              'created',
            );
          } catch (conditionError) {
            errors.push(
              new ValidationError(SHEET_NAME, sheetRow, conditionError.message),
            );
            updateStat(
              stats,
              statkey('PatientProgramRegistrationCondition', SHEET_NAME),
              'errored',
            );
          }
        }
      }
    } catch (e) {
      const errs = Array.isArray(e) ? e : [e];
      errors.push(...errs.map(error => new ValidationError(SHEET_NAME, sheetRow, error.message)));
      updateStat(stats, statkey('PatientProgramRegistration', SHEET_NAME), 'errored');
    }
  }

  return stats;
}
