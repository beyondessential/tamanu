import shortid from 'shortid';

export const isPrimaryTab = () => {
  return window.localStorage.getItem('primaryTab') === window.name;
};

export const initialiseSingleTabDetection = () => {
  if (!window.name) window.name = shortid();

  if (!window.localStorage.getItem('primaryTab')) {
    window.localStorage.setItem('primaryTab', window.name);
    window.onbeforeunload = () => {
      window.localStorage.removeItem('primaryTab');
    };
  }
};
