import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { addDays, differenceInDays, parseISO, subDays } from 'date-fns';
import { VISIBILITY_STATUSES, VACCINE_CATEGORIES, VACCINE_STATUS } from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

const asRealNumber = value => {
  let num = value;
  if (typeof num === 'string') {
    num = Number.parseInt(value, 10);
  }
  if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`asRealNumber: expected real numeric string or number, got ${value}`);
  }
  return num;
};

const mockDueDate = index => {
  let dueDate;

  switch (true) {
    case index === 0:
      dueDate = toDateTimeString(addDays(new Date(), 30));
      break;
    case index === 1:
      dueDate = toDateTimeString(addDays(new Date(), 10));
      break;
    case index === 2:
      dueDate = toDateTimeString(addDays(new Date(), 1));
      break;
    case index === 3:
      dueDate = toDateTimeString(subDays(new Date(), 10));
      break;
    default:
      dueDate = toDateTimeString(subDays(new Date(), 60));
      break;
  }

  return toDateTimeString(dueDate);
};

const mockStatusLogic = date => {
  const dateObj = parseISO(date);
  const currentDate = new Date();

  const days = differenceInDays(dateObj, currentDate);

  switch (true) {
    case days >= 28:
      return VACCINE_STATUS.SCHEDULED;
    case days >= 7:
      return VACCINE_STATUS.UPCOMING;
    case days >= -7:
      return VACCINE_STATUS.DUE;
    case days >= -56:
      return VACCINE_STATUS.OVERDUE;
    default:
      return VACCINE_STATUS.MISSED;
  }
};

const mockVaccineSchedule = (record, index) => {
  // Get start of week
  const dueDate = mockDueDate(index);
  const vaccineScheduleStatus = mockStatusLogic(dueDate);
  return { ...record, dueDate, vaccineScheduleStatus };
};

export const patientVaccineScheduleRoutes = express.Router();

// This is just a temporary endpoint for demoing the front-end.
// It will be updated in NASS-1146.
patientVaccineScheduleRoutes.get(
  '/:id/vaccineSchedule',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientVaccine');

    const results = await req.db.query(
      `
      SELECT
        sv.id
        , max(sv.category) AS category
        , max(sv.label) AS label
        , max(sv.schedule) AS schedule
        , max(sv.weeks_from_birth_due) AS weeks_from_birth_due
        , max(sv.vaccine_id) AS vaccine_id
        , max(sv.visibility_status) AS visibility_status
        , count(av.id) AS administered
        FROM scheduled_vaccines sv
        LEFT JOIN (
          SELECT
            av.*
          FROM
            administered_vaccines av
            JOIN encounters e ON av.encounter_id = e.id
          WHERE
            e.patient_id = :patientId) av ON sv.id = av.scheduled_vaccine_id
        WHERE sv.category = :category
        GROUP BY sv.id
        ORDER BY sv.index, max(sv.label), max(sv.schedule);
      `,
      {
        replacements: {
          patientId: req.params.id,
          category: VACCINE_CATEGORIES.ROUTINE,
        },
        model: req.models.ScheduledVaccine,
        mapToModel: true,
        type: QueryTypes.SELECT,
      },
    );

    const vaccines = results
      .map(s => s.get({ plain: true }))
      .reduce((allVaccines, vaccineSchedule) => {
        const administered = asRealNumber(vaccineSchedule.administered) > 0;
        if (!allVaccines[vaccineSchedule.label]) {
          delete vaccineSchedule.administered;
          vaccineSchedule.schedules = [];
          allVaccines[vaccineSchedule.label] = vaccineSchedule;
        }
        // Exclude historical schedules unless administered
        if (vaccineSchedule.visibilityStatus !== VISIBILITY_STATUSES.HISTORICAL || administered) {
          allVaccines[vaccineSchedule.label].schedules.push({
            schedule: vaccineSchedule.schedule,
            scheduledVaccineId: vaccineSchedule.id,
            administered,
          });
        }
        return allVaccines;
      }, {});

    // Exclude vaccines that already have all the schedules administered for the patient
    const availableVaccines = Object.values(vaccines).filter(v =>
      v.schedules.some(s => !s.administered),
    );

    const mockedResults = availableVaccines.map(mockVaccineSchedule);
    res.send({ count: availableVaccines.length, data: mockedResults });
  }),
);
