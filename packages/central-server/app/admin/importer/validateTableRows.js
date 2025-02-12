async function validateLabTestTypes(models, rows, pushErrorFn) {
  // Ensure data is correct at spreadsheet level
  const categories = {};
  for (const { values } of rows) {
    const { isSensitive = false, labTestCategoryId } = values;

    const isNewCategory = categories[labTestCategoryId] === undefined;
    if (!isNewCategory && categories[labTestCategoryId] !== isSensitive) {
      pushErrorFn(-3, 'Only sensitive lab test types allowed in sensitive category');
      break;
    }

    categories[labTestCategoryId] = isSensitive;
  }

  // Ensure data is correct at db level
  for (const { values, sheetRow } of rows) {
    const { isSensitive = false, labTestCategoryId } = values;
    const otherLabTestTypes = await models.LabTestType.findAll({
      where: { labTestCategoryId },
    });
    console.log(otherLabTestTypes.map(x => x.dataValues));

    if (otherLabTestTypes.length !== 0) {
      const areAllSensitive = otherLabTestTypes.every(type => type.isSensitive);
      if (isSensitive && !areAllSensitive) {
        pushErrorFn(
          sheetRow,
          `Cannot add sensitive lab test type to non sensitive category '${labTestCategoryId}'`,
        );
      } else if (!isSensitive && areAllSensitive) {
        pushErrorFn(
          sheetRow,
          `Cannot add non sensitive lab test type to sensitive category '${labTestCategoryId}'`,
        );
      }
    }
  }
}

const MODEL_VALIDATION = {
  'LabTestType': validateLabTestTypes,
};

export async function validateTableRows(models, rows, pushErrorFn) {
  const modelName = rows[0].model;
  if (MODEL_VALIDATION[modelName]) {
    await MODEL_VALIDATION[modelName](models, rows, pushErrorFn);
  }
}
