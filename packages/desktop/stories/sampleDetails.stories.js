import React from 'react';
import Chance from 'chance';
import { USERS } from 'shared/demoData/users';
import { SPECIMEN_TYPES } from 'shared/demoData/specimenTypes';
import { LAB_SAMPLE_SITES } from 'shared/demoData/labSampleSites';
import { Formik } from 'formik';
import { SampleDetailsField } from '../app/views/labRequest/SampleDetailsField';
import { createDummySuggester, mapToSuggestions } from './utils';

export default {
  title: 'SampleDetailsField',
  component: SampleDetailsField,
};

const chance = new Chance();

const userSuggester = createDummySuggester(mapToSuggestions(USERS));
const specimenTypeSuggester = createDummySuggester(mapToSuggestions(SPECIMEN_TYPES));
const labSampleSiteSuggester = createDummySuggester(mapToSuggestions(LAB_SAMPLE_SITES));
const labRequests = ['Microbiology', 'Malaria', 'Serology', 'Covid'].map(category => ({
  id: chance.hash({ length: 8 }),
  categoryName: category,
  categoryId: category,
}));

const Template = args => (
  <Formik initialValues={{}}>
    <SampleDetailsField
      userSuggester={userSuggester}
      specimenTypeSuggester={specimenTypeSuggester}
      labSampleSiteSuggester={labSampleSiteSuggester}
      field={{}}
      labRequests={labRequests}
      {...args}
    />
  </Formik>
);

export const Default = Template.bind({});
Default.args = {};
