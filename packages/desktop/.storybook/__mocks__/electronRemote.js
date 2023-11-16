export default {
  app: {
    getLocale: () => navigator.language,
  },
  getGlobal: key => {
    if (key === 'osLocales') return navigator.language;
  },
};
