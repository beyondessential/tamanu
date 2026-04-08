import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';

const reorderSchema = z.object({
  layouts: z
    .array(
      z.object({
        id: z.string(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

const visibilitySchema = z.object({
  visibilityStatus: z.enum([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
});

export const reorderPatientFieldLayouts = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'PatientFieldLayout');

  const { PatientFieldLayout } = req.store.models;
  const { layouts } = await reorderSchema.parseAsync(req.body);

  const layoutIds = layouts.map(l => l.id);
  const existing = await PatientFieldLayout.findAll({
    where: { id: { [Op.in]: layoutIds } },
  });

  if (existing.length !== layoutIds.length) {
    throw new NotFoundError('Some patient field layouts were not found');
  }

  await PatientFieldLayout.sequelize.transaction(async () => {
    for (const { id, sortOrder } of layouts) {
      await PatientFieldLayout.update({ sortOrder }, { where: { id } });
    }
  });

  res.send({ success: true });
});

export const updatePatientFieldLayoutVisibility = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'PatientFieldLayout');

  const { PatientFieldLayout, PatientFieldDefinition, Setting } = req.store.models;
  const { id } = req.params;
  const { visibilityStatus } = await visibilitySchema.parseAsync(req.body);

  const layout = await PatientFieldLayout.findByPk(id);
  if (!layout) {
    throw new NotFoundError(`No patient field layout found with ID '${id}'`);
  }

  if (!layout.canHide) {
    throw new InvalidOperationError('This field cannot be hidden');
  }

  if (layout.fieldKey) {
    // Built-in field: toggle the hidden setting
    const settingKey = `fields.${layout.fieldKey}.hidden`;
    const isHidden = visibilityStatus === VISIBILITY_STATUSES.HISTORICAL;

    const [setting] = await Setting.findOrCreate({
      where: { key: settingKey, facilityId: null },
      defaults: { key: settingKey, value: isHidden, scope: 'global' },
    });
    await setting.update({ value: isHidden });
  } else if (layout.definitionId) {
    // Custom field: update the definition's visibilityStatus
    await PatientFieldDefinition.update(
      { visibilityStatus },
      { where: { id: layout.definitionId } },
    );
  }

  res.send({ success: true, visibilityStatus });
});
