import path from 'path';

export const getTamanuPackagesPath = () => {
  const centralServerDistIndexJsPath = require.resolve('@tamanu/central-server');
  const tamanuPackagesPath = path.join(
    centralServerDistIndexJsPath,
    '..', // dist
    '..', // central-server
    '..', // packages
  );
  return tamanuPackagesPath;
};
