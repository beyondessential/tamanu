import React from 'react';
import Chance from 'chance';
import { USERS } from 'shared/demoData/users';
import { SPECIMEN_TYPES } from 'shared/demoData/specimenTypes';
import { LAB_SAMPLE_SITES } from 'shared/demoData/labSampleSites';
import { Formik } from 'formik';
import { CategoryTestSampleField } from '../app/views/labRequest/CategoryTestSample';
import { createDummySuggester, mapToSuggestions } from './utils';

export default {
  title: 'CategoryTestSample',
  component: CategoryTestSampleField,
};

const chance = new Chance();

const userSuggester = createDummySuggester(mapToSuggestions(USERS));
const specimenTypeSuggester = createDummySuggester(mapToSuggestions(SPECIMEN_TYPES));
const labSampleSiteSuggester = createDummySuggester(mapToSuggestions(LAB_SAMPLE_SITES));
const categories = ['Microbiology', 'Malaria', 'Serology', 'Covid'].map(category => ({
  id: chance.hash({ length: 8 }),
  name: category,
}));

const Template = args => (
  <Formik initialValues={{}}>
    <CategoryTestSampleField
      userSuggester={userSuggester}
      specimenTypeSuggester={specimenTypeSuggester}
      labSampleSiteSuggester={labSampleSiteSuggester}
      field={{}}
      categories={categories}
      {...args}
    />
  </Formik>
);

export const Default = Template.bind({});
Default.args = {};
