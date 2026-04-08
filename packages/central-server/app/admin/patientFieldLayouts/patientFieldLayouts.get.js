import asyncHandler from 'express-async-handler';

export const getPatientFieldLayouts = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'PatientFieldLayout');

  const { PatientFieldLayout, PatientFieldDefinition, PatientFieldDefinitionCategory, Setting } =
    req.store.models;

  const layouts = await PatientFieldLayout.findAll({
    include: [
      {
        model: PatientFieldDefinition,
        as: 'definition',
        attributes: ['id', 'name', 'fieldType', 'options', 'visibilityStatus'],
      },
      {
        model: PatientFieldDefinitionCategory,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [
      ['section', 'ASC NULLS LAST'],
      ['categoryId', 'ASC NULLS LAST'],
      ['sortOrder', 'ASC'],
    ],
  });

  // Look up hidden settings for built-in fields
  const builtInFieldKeys = layouts
    .filter(l => l.fieldKey)
    .map(l => `fields.${l.fieldKey}.hidden`);

  const hiddenSettings = builtInFieldKeys.length > 0
    ? await Setting.findAll({
        where: { key: builtInFieldKeys },
        attributes: ['key', 'value'],
      })
    : [];

  const hiddenFieldKeys = new Set(
    hiddenSettings
      .filter(s => s.value === true || s.value === 'true')
      .map(s => s.key.replace(/^fields\./, '').replace(/\.hidden$/, '')),
  );

  // Derive visibilityStatus for each layout
  const response = layouts.map(l => {
    const data = l.forResponse();
    if (l.fieldKey) {
      // Built-in field: visibility comes from settings
      data.visibilityStatus = hiddenFieldKeys.has(l.fieldKey) ? 'historical' : 'current';
    } else if (l.definition) {
      // Custom field: visibility comes from the definition
      data.visibilityStatus = l.definition.visibilityStatus;
    } else {
      data.visibilityStatus = 'current';
    }
    return data;
  });

  res.send(response);
});
