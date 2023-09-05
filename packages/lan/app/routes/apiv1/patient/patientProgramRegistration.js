import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

export const patientProgramRegistration = express.Router();

// const MOST_RECENT_WHERE_CONDITION = {
//   id: {
//     [Op.notIn]: db.literal(`
//       (
//         SELECT id
//         FROM (
//           SELECT id, revised_by_id, ROW_NUMBER() OVER (PARTITION BY revised_by_id ORDER BY date DESC, id DESC) AS row_num
//           FROM notes
//           WHERE revised_by_id IS NOT NULL
//         ) n
//         WHERE n.row_num != 1
//       )
//     `),
//   },
// }
const MOST_RECENT_WHERE_CONDITION_LITERAL = `
  (
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
      FROM patient_program_registrations
    ) n
    WHERE n.row_num = 1
  )
`;

patientProgramRegistration.get(
  '/:id/programRegistration',
  asyncHandler(async (req, res) => {
    const { db, params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    console.log('hey!');
    const registrationData1 = await db.query(`
      SELECT ppr.* FROM patient_program_registrations ppr
      JOIN (
        SELECT 
          id,
          ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
          FROM patient_program_registrations
      ) n ON n.id = ppr.id
      WHERE n.row_num = 1
    `);
    console.log(registrationData1.data);
    const registrationData = await models.PatientProgramRegistration.findAll({
      where: {
        id: db.literal(MOST_RECENT_WHERE_CONDITION_LITERAL),
        patientId: params.id,
      },
    });
    console.log(registrationData);

    const recordData = registrationData ? registrationData.toJSON() : {};

    res.send({ ...recordData });
  }),
);

// patientProgramRegistration.post(
//   '/:id/patientProgramRegistration',
//   asyncHandler(async (req, res) => {
//     const { models, params, body } = req;
//     req.checkPermission('read', 'Patient');
//     const patient = await models.Patient.findByPk(params.id);
//     if (!patient) throw new NotFoundError();

//     req.checkPermission('create', 'PatientSecondaryId');
//     const secondaryId = await models.PatientSecondaryId.create({
//       value: req.body.value,
//       visibilityStatus: req.body.visibilityStatus,
//       typeId: req.body.typeId,
//       patientId: params.id,
//     });

//     res.send(secondaryId);
//   }),
// );

// patientProgramRegistration.post(
//   '/:id/patientProgramRegistration',
//   asyncHandler(async (req, res) => {
//     const { models, params, query } = req;
//     const { facilityId } = query;

//     req.checkPermission('read', 'Patient');
//     req.checkPermission('read', 'PatientProgramRegistration');

//     const registrationData = await models.PatientProgramRegistration.findOne({
//       where: { patientId: params.id },
//     });

//     const recordData = registrationData ? registrationData.toJSON() : {};

//     res.send({ ...recordData });
//   }),
// );
