import { REFERENCE_TYPES } from '@tamanu/constants';

export default {
  run: async store => {
    const { ReferenceData } = store.models;
    const [covidCategory] = await ReferenceData.upsert(
      {
        id: 'labTestCategory-COVID',
        code: 'COVID',
        name: 'COVID-19 Swab',
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      },
      { returning: true },
    );
    return [covidCategory]; // report specifies multiple but workbook only has one
  },
};
