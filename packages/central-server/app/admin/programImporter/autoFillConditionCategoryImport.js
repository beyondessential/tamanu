import {
  VISIBILITY_STATUSES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants';

function createCategoryRowFromSpreadsheet(spreadsheetCategory, registryId) {
  return {
    model: 'ProgramRegistryConditionCategory',
    sheetRow: spreadsheetCategory.__rowNum__ - 1,
    values: {
      id: `program-registry-condition-category-${spreadsheetCategory.code}`,
      programRegistryId: registryId,
      ...spreadsheetCategory,
    },
  };
}

function createCategoryRowFromHardcoded(code, registryId, registryCode) {
  return {
    model: 'ProgramRegistryConditionCategory',
    sheetRow: -1, // Indicates this is a hardcoded category
    values: {
      id: `program-registry-condition-category-${registryCode}-${code}`,
      programRegistryId: registryId,
      code: code,
      name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[code],
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  };
}

export async function autoFillConditionCategoryImport(
  context,
  programRegistryConditionCategories,
  registryId,
  registryCode,
) {
  // Create a map of spreadsheet categories by code for easy lookup
  const spreadsheetCategoriesMap = new Map(
    programRegistryConditionCategories.map((row) => [row.code, row]),
  );

  // Prepare rows for import - start with hardcoded categories
  const categoryRows = [];

  // Add hardcoded categories (spreadsheet overrides if code matches)
  for (const [_, code] of Object.entries(PROGRAM_REGISTRY_CONDITION_CATEGORIES)) {
    const spreadsheetCategory = spreadsheetCategoriesMap.get(code);

    if (spreadsheetCategory) {
      // Use spreadsheet definition if it exists
      categoryRows.push(createCategoryRowFromSpreadsheet(spreadsheetCategory, registryId));
      // Remove from map so we don't add it again
      spreadsheetCategoriesMap.delete(code);
    } else {
      // Check if record already exists in database
      const existingCategory = await context.models.ProgramRegistryConditionCategory.findOne({
        where: {
          code: code,
          programRegistryId: registryId,
        },
      });

      if (!existingCategory) {
        // Use hardcoded definition
        categoryRows.push(createCategoryRowFromHardcoded(code, registryId, registryCode));
      }
    }
  }

  // Add any additional categories from spreadsheet that don't match hardcoded codes
  spreadsheetCategoriesMap.forEach((row) => {
    categoryRows.push(createCategoryRowFromSpreadsheet(row, registryId));
  });

  return categoryRows;
}
