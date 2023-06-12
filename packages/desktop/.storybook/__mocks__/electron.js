export const remote = {
  app: {
    getLocale: () => navigator.language
  },
  getGlobal: (key) => {
    if (key === 'osLocales') return navigator.language
  }
};

export default {
  remote
};
