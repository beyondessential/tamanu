import asyncHandler from 'express-async-handler';
import { ProcedureSchema } from '@tamanu/shared/schemas/patientPortal/responses/procedure.schema';
import { getAttributesFromSchema } from '../../utils/schemaUtils';

export const getProcedures = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;
  const procedures = await models.Procedure.findAll({
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        attributes: [],
        where: { patientId: patient.id },
        required: true, // Ensures it's an INNER JOIN
      },
      {
        model: models.ReferenceData,
        as: 'procedureType',
        attributes: getAttributesFromSchema(ProcedureSchema.shape.procedureType),
      },
      {
        model: models.User,
        as: 'leadClinician',
        attributes: getAttributesFromSchema(ProcedureSchema.shape.leadClinician),
      },
    ],
    attributes: getAttributesFromSchema(ProcedureSchema),
  });

  res.send(procedures.map(procedure => ProcedureSchema.parse(procedure.forResponse())));
});
