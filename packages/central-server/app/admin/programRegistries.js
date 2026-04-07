import asyncHandler from 'express-async-handler';

import { NotFoundError } from '@tamanu/errors';

export const getProgramRegistryHandler = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'ProgramRegistry');

  const { ProgramRegistry, Program } = req.models;
  const programRegistry = await ProgramRegistry.findByPk(req.params.id, {
    include: [
      {
        model: Program,
        as: 'program',
        attributes: ['id', 'name'],
      },
    ],
  });
  if (!programRegistry) throw new NotFoundError();

  res.send({
    ...programRegistry.forResponse(),
    program: programRegistry.program
      ? { id: programRegistry.program.id, name: programRegistry.program.name }
      : null,
  });
});
