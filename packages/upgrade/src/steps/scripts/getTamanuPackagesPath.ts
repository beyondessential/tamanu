import path from 'path';

export const getTamanuPackagesPath = () => {
  const updateDistCjsIndexJsPath = require.resolve('@tamanu/upgrade');
  const tamanuPackagesPath = path.join(
    updateDistCjsIndexJsPath,
    '..', // cjs
    '..', // dist
    '..', // upgrade
    '..', // packages
  );
  return tamanuPackagesPath;
};
