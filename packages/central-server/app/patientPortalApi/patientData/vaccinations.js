import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { UpcomingVaccinationSchema } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { VACCINE_STATUS } from '@tamanu/constants';

export const getUpcomingVaccinations = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { sequelize } = req.store;

  // Query the upcoming_vaccinations view with scheduled vaccine and vaccine reference data
  const results = await sequelize.query(
    `
    SELECT
      -- Scheduled vaccine fields
      sv.id as "scheduledVaccine.id",
      sv.category as "scheduledVaccine.category",
      sv.label as "scheduledVaccine.label",
      sv.dose_label as "scheduledVaccine.doseLabel",
      sv.weeks_from_birth_due as "scheduledVaccine.weeksFromBirthDue",
      sv.visibility_status as "scheduledVaccine.visibilityStatus",
      -- Vaccine reference data fields
      rd.id as "vaccine.id",
      rd.name as "vaccine.name",
      rd.code as "vaccine.code",
      rd.type as "vaccine.type",
      -- Upcoming vaccination fields
      uv.due_date "dueDate",
      uv.days_till_due "daysTillDue",
      uv.status
    FROM upcoming_vaccinations uv
    JOIN scheduled_vaccines sv ON sv.id = uv.scheduled_vaccine_id
    JOIN reference_data rd ON rd.id = uv.vaccine_id
    WHERE uv.patient_id = :patientId
      AND uv.status != :missedStatus
    ORDER BY uv.due_date ASC, sv.label
    `,
    {
      replacements: {
        patientId: patient.id,
        missedStatus: VACCINE_STATUS.MISSED,
      },
      type: QueryTypes.SELECT,
    },
  );

  // Transform the flat results into nested objects matching the schema
  const upcomingVaccinations = results.map(row => ({
    scheduledVaccine: {
      id: row['scheduledVaccine.id'],
      category: row['scheduledVaccine.category'],
      label: row['scheduledVaccine.label'],
      doseLabel: row['scheduledVaccine.doseLabel'],
      weeksFromBirthDue: row['scheduledVaccine.weeksFromBirthDue'],
      vaccine: {
        id: row['vaccine.id'],
        name: row['vaccine.name'],
        code: row['vaccine.code'],
        type: row['vaccine.type'],
      },
      visibilityStatus: row['scheduledVaccine.visibilityStatus'],
    },
    vaccine: {
      id: row['vaccine.id'],
      name: row['vaccine.name'],
      code: row['vaccine.code'],
      type: row['vaccine.type'],
    },
    dueDate: row.dueDate,
    daysTillDue: row.daysTillDue,
    status: row.status,
  }));

  res.send({
    data: upcomingVaccinations.map(vaccination => UpcomingVaccinationSchema.parse(vaccination)),
  });
});

export const getAdministeredVaccines = asyncHandler(async (req, res) => {
  const { patient } = req;

  const administeredVaccines = (await patient.getAdministeredVaccines()).data;

  res.send(administeredVaccines.map(vaccine => AdministeredVaccineSchema.parse(vaccine)));
});
