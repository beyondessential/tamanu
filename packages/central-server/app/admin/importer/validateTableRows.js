async function validateLabTestTypes(models, rows, pushErrorFn) {
  // Ensure data is correct at spreadsheet level
  const categories = {};
  for (const { model, values } of rows) {
    const { isSensitive = false, labTestCategoryId } = values;

    const isNewCategory = categories[labTestCategoryId] === undefined;
    if (!isNewCategory && categories[labTestCategoryId] !== isSensitive) {
      pushErrorFn(model, -3, 'Only sensitive lab test types allowed in sensitive category');
      break;
    }

    categories[labTestCategoryId] = isSensitive;
  }

  // Keep track of all IDs included in spreadsheet
  const testsByCategory = {};
  for (const { values } of rows) {
    const { id, labTestCategoryId } = values;

    if (testsByCategory[labTestCategoryId] === undefined) {
      testsByCategory[labTestCategoryId] = [id];
    } else {
      testsByCategory[labTestCategoryId].push(id);
    }
  }

  // Ensure data is correct at db level
  for (const { model, values, sheetRow } of rows) {
    const { isSensitive = false, labTestCategoryId } = values;
    const otherLabTestTypes = await models.LabTestType.findAll({
      where: { labTestCategoryId },
    });

    if (otherLabTestTypes.length !== 0) {
      // Bypass check if we are updating all from that category
      const areAllIncluded = otherLabTestTypes.every(
        testType => testsByCategory[labTestCategoryId].includes(testType.id),
      );
      if (areAllIncluded) {
        continue;
      }

      const areAllSensitive = otherLabTestTypes.every(type => type.isSensitive);
      if (isSensitive && !areAllSensitive) {
        pushErrorFn(
          model,
          sheetRow,
          `Cannot add sensitive lab test type to non sensitive category '${labTestCategoryId}'`,
        );
      } else if (!isSensitive && areAllSensitive) {
        pushErrorFn(
          model,
          sheetRow,
          `Cannot add non sensitive lab test type to sensitive category '${labTestCategoryId}'`,
        );
      }
    }
  }
}

async function validateLabTestPanels(models, rows, pushErrorFn) {
  for (const { model, values} of rows) {
    if (model !== 'LabTestPanelLabTestTypes') {
      continue;
    }

    // This works because LabTestType is always upserted before panels
    const { labTestTypeId } = values;
    const labTestType = await models.LabTestType.findOne({ where: { id: labTestTypeId }});
    if (labTestType?.isSensitive) {
      pushErrorFn(model, -3, 'Lab test panels cannot contain sensitive lab test types');
    }
  }
}

async function validateUsers(_models, rows, pushErrorFn) {
  const seenEmails = new Map();
  const seenDisplayNames = new Map();
  for (const { model, values, sheetRow } of rows) {
    if (model !== 'User') continue;

    if (values.email) {
      const emailKey = values.email.toLowerCase();
      if (seenEmails.has(emailKey)) {
        pushErrorFn(model, sheetRow, `Duplicate email "${values.email}" within import`);
      } else {
        seenEmails.set(emailKey, sheetRow);
      }
    }

    if (values.displayName) {
      const nameKey = values.displayName.toLowerCase();
      if (seenDisplayNames.has(nameKey)) {
        pushErrorFn(model, sheetRow, `Duplicate display name "${values.displayName}" within import`);
      } else {
        seenDisplayNames.set(nameKey, sheetRow);
      }
    }
  }
}

const MODEL_VALIDATION = {
  'LabTestType': validateLabTestTypes,
  'LabTestPanel': validateLabTestPanels,
  'User': validateUsers,
};

export async function validateTableRows(models, rows, pushErrorFn) {
  const modelName = rows[0].model;
  if (MODEL_VALIDATION[modelName]) {
    await MODEL_VALIDATION[modelName](models, rows, pushErrorFn);
  }
}
