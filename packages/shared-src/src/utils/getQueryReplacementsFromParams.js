const CATCH_ALL_FROM_DATE = '01-01-1970';

export const getQueryReplacementsFromParams = (paramDefinitions, params = {}) => {
  const paramDefaults = paramDefinitions.reduce((obj, { name }) => ({ ...obj, [name]: '%' }), {
    fromDate: new Date(CATCH_ALL_FROM_DATE),
    toDate: new Date(),
  });
  return { ...paramDefaults, ...params };
};
