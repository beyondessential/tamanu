import * as yup from 'yup';

export const unhideableLayoutModuleProperties = {
  sortPriority: {
    description: 'Modules are ordered based on this value from lowest to highest',
    schema: yup.number(),
    defaultValue: -100,
  },
//   TODO: possibly just remove this
  hidden: {
    description: 'Hide this module from the ui',
    schema: yup.boolean().oneOf([false], 'unhideable tabs must not be hidden'),
    defaultValue: false,
  },
};

export const layoutModuleProperties = {
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
