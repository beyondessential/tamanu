export const app = {
  getLocale: () => navigator.language,
};

export const getGlobal = key => {
  if (key === 'osLocales') return navigator.language;
};

export default {
  app,
  getGlobal,
};
