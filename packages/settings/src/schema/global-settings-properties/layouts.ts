import * as yup from 'yup';

export const unhideableLayoutModuleValues = {
  sortPriority: {
    description: 'Modules are ordered based on this value from lowest to highest',
    schema: yup.number(),
    defaultValue: -100,
  },
  hidden: {
    description: 'Hide this module from the ui',
    schema: yup.boolean().oneOf([false], 'unhideable tabs must not be hidden'),
    defaultValue: false,
  },
};

export const layoutModuleValues = {
  sortPriority: {
    description: 'Modules are ordered based on this value from lowest to highest',
    schema: yup.number(),
    defaultValue: 0,
  },
  hidden: {
    description: 'Hide this module from the ui',
    schema: yup.boolean(),
    defaultValue: false,
  },
};
