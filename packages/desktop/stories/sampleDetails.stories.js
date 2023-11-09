import React from 'react';
import Chance from 'chance';
import { USERS } from '@tamanu/shared/demoData/users';
import { SPECIMEN_TYPES } from '@tamanu/shared/demoData/specimenTypes';
import { LAB_SAMPLE_SITES } from '@tamanu/shared/demoData/labSampleSites';
import { SampleDetailsField } from '../app/views/labRequest/SampleDetailsField';
import { createDummySuggester, mapToSuggestions } from './utils';
import { Form } from '../app/components';

export default {
  title: 'SampleDetailsField',
  component: SampleDetailsField,
};

const chance = new Chance();

const practitionerSuggester = createDummySuggester(mapToSuggestions(USERS));
const specimenTypeSuggester = createDummySuggester(mapToSuggestions(SPECIMEN_TYPES));
const labSampleSiteSuggester = createDummySuggester(mapToSuggestions(LAB_SAMPLE_SITES));
const initialSamples = ['Microbiology', 'Malaria', 'Serology', 'Covid'].map(category => ({
  id: chance.hash({ length: 8 }),
  categoryName: category,
  categoryId: category,
}));
const withPanelsRequests = initialSamples.map((groupedRequest, index) => ({
  ...groupedRequest,
  panelId: `{panel-${index}`,
  panelName: `Panel ${index}`,
}));
const Template = args => (
  <Form
    render={() => (
      <SampleDetailsField
        practitionerSuggester={practitionerSuggester}
        specimenTypeSuggester={specimenTypeSuggester}
        labSampleSiteSuggester={labSampleSiteSuggester}
        initialSamples={initialSamples}
        {...args}
      />
    )}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithPanels = Template.bind({});
WithPanels.args = {
  initialSamples: withPanelsRequests,
};
