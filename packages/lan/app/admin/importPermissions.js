import { readFile, utils } from 'xlsx';

import { log } from 'shared/services/logging';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');

const roleTransformer = type => item => {
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
  const { verb, noun, objectId, note, ...roles } = item;
  // Any non-empty value in the role cell would mean the role
  // is enabled for the permission
  return Object.keys(roles)
    .filter(role => roles[role].toLowerCase().trim() === 'y')
    .map(role => ({
      recordType: 'permission',
      recordId: `${role}-${verb}-${noun}-${objectId}`,
      data: {
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
  const importSheet = sheetName => {
    const sheet = sheets[sheetName.toLowerCase()];
    const data = utils.sheet_to_json(sheet);
    const transformer = sheetName === 'roles' ? roleTransformer : permissionTransformer;

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

  // TODO turn the sheets into records based on 
  // - role: role transformer
  // - anything else: record transformer

  // figure out which transformers we're actually using
  /*
  const activeTransformers = transformers.filter(({ sheetName, transformer }) => {
    if (!transformer) return false;
    if (whitelist.length > 0 && !lowercaseWhitelist.includes(sheetName.toLowerCase())) {
      return false;
    }
    const sheet = sheets[sheetName.toLowerCase()];
    if (!sheet) return false;

    return true;
  });

  // restructure the parsed data to sync record format
  return activeTransformers
    .map(({ sheetName, transformer }) => importSheet(sheetName, transformer))
    .flat()
    .filter(x => x);
  */

  return [];
}
