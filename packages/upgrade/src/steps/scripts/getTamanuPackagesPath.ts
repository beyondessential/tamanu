import path from 'path';

export const getTamanuPackagesPath = () => {
  const centralServerDistIndexJsPath = require.resolve('@tamanu/upgrade');
  const tamanuPackagesPath = path.join(
    centralServerDistIndexJsPath,
    '..', // cjs
    '..', // dist
    '..', // upgrade
    '..', // packages
  );
  return tamanuPackagesPath;
};
