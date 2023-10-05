export const remote = {
  app: {
    getLocale: () => navigator.language,
  },
  getGlobal: key => {
    if (key === 'osLocales') return navigator.language;
  },
};

export const ipcRenderer = {
  invoke: () => true,
  on: () => true,
};

export default {
  remote,
  ipcRenderer,
};
