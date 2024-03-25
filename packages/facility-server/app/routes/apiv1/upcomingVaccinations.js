import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

export const upcomingVaccinations = express.Router();

upcomingVaccinations.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');

    const results = await req.db.query(
      `
      WITH upcoming_vaccinations_with_row_number AS (
        SELECT *,
        ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY due_date ASC) AS row_number
        FROM upcoming_vaccinations uv
      )
      SELECT
      p.id id,
      p.display_id "displayId",
      p.first_name "firstName",
      p.last_name "lastName",
      p.date_of_birth "dateOfBirth",
      p.sex,
      sv.id scheduledVaccineId,
      sv.category,
      sv.label "vaccineName",
      sv.schedule "scheduleName",
      sv.vaccine_id vaccineId,
      uv.due_date "dueDate",
      uv.status,
      village.name "villageName"
      FROM upcoming_vaccinations_with_row_number uv
      JOIN scheduled_vaccines sv ON sv.id = uv.scheduled_vaccine_id
      JOIN patients p ON p.id = uv.patient_id
      JOIN reference_data village ON village.id = p.village_id
      WHERE uv.status <> 'MISSED'
      AND row_number = 1
      ORDER BY uv.due_date, sv.label;`,
      {
        type: QueryTypes.SELECT,
      },
    );

    return res.send({ data: results, count: results.length });
  }),
);
