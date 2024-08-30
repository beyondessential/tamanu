import * as yup from 'yup';

export const unhideableLayoutModuleProperties = {
  sortPriority: {
    description: 'Customise the layout of modules',
    type: yup.number(),
    defaultValue: -100,
  },
};

export const layoutModuleProperties = {
  sortPriority: {
    description: 'Customise the layout of modules',
    type: yup.number(),
    defaultValue: 0,
  },
  hidden: {
    description: 'Hide this module from the ui',
    type: yup.boolean(),
    defaultValue: false,
  },
};
