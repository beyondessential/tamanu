import { readFile, utils } from 'xlsx';

import { log } from 'shared/services/logging';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');

const roleTransformer = item => {
  // ignore "note" column
  const { note, ...rest } = item;
  return {
    recordType: 'role',
    data: {
      ...rest,
    },
  };
};

const permissionTransformer = item => {
  const { verb, noun, objectId = null, note, ...roles } = item;
  // Any non-empty value in the role cell would mean the role
  // is enabled for the permission
  return Object.keys(roles)
    .filter(role => roles[role].toLowerCase().trim())
    .map(role => ({
      recordType: 'permission',
      recordId: `${role}-${verb}-${noun}-${objectId || '*'}`,
      data: {
        _yCell: roles[role].toLowerCase().trim(), // only used for validation
        verb,
        noun,
        objectId,
        role,
      },
    }));
};

export async function importPermissions({ file }) {
  log.info(`Importing permissions from ${file}...`);

  // parse xlsx
  const workbook = readFile(file);
  const sheets = Object.entries(workbook.Sheets).reduce(
    (group, [sheetName, sheet]) => ({
      ...group,
      [sanitise(sheetName).toLowerCase()]: sheet,
    }),
    {},
  );

  // set up the importer
  const importSheet = (sheetName, transformer) => {
    const sheet = sheets[sheetName];
    const data = utils.sheet_to_json(sheet);

    return data
      .filter(item => Object.values(item).some(x => x))
      .map(item => {
        const transformed = transformer(item);
        if (!transformed) return null;

        // transformer can return an object or an array of object
        return [transformed].flat().map(t => ({
          sheet: sheetName,
          row: item.__rowNum__ + 1, // account for 0-based js vs 1-based excel
          ...t,
        }));
      })
      .flat();
  };

  const { roles, ...permissionSheets } = sheets;
  const roleRecords = importSheet('roles', roleTransformer);
  const permissionRecords = Object.keys(permissionSheets)
    .map(sheet => importSheet(sheet, permissionTransformer))
    .flat();

  return [...roleRecords, ...permissionRecords];
}
