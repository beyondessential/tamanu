import express from 'express';
import { deleteRoleById } from './roles.delete';
import { getRoleById, getRoleDeletabilityById, getRoles } from './roles.get';
import { createRole } from './roles.post';

/** `/admin/role` endpoint for CRUD-ing a single role */
export const roleRouter = express.Router();

roleRouter.get('/:id/isDeletable', getRoleDeletabilityById);
roleRouter.get('/:id', getRoleById);
roleRouter.post('/', createRole);
roleRouter.delete('/:id', deleteRoleById);

/** `/admin/roles` endpoint for CRUD-ing multiple roles at once */
export const rolesRouter = express.Router();

rolesRouter.get('/', getRoles);
