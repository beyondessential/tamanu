import React from 'react';
import styled from 'styled-components';
import { AutocompleteField, Field } from '../../app/components';
import { MockedApi } from '../utils/mockedApi';
import { LinkedField } from '../../app/components/Field/LinkedField';
import { Form } from '../../app/components/Field';
import { TranslationProvider } from '../../app/contexts/Translation';
import { createDummySuggester, mapToSuggestions } from '../utils';

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const endpoints = {
  'linkedField/healthCenter/:id': (_, query) => {
    if (['1', '2'].includes(query)) return { id: '1', name: 'Health Facility 1' };
    return { id: '2', name: 'Health Facility 2' };
  },
};

const mockVillageSuggester = createDummySuggester(
  mapToSuggestions([
    {
      id: '1',
      name: 'Village 1',
    },
    {
      id: '2',
      name: 'Village 2',
    },
    {
      id: '3',
      name: 'Village 3',
    },
    {
      id: '4',
      name: 'Village 4',
    },
  ]),
);
const mockHealthFacilitySuggester = createDummySuggester(
  mapToSuggestions([
    {
      id: '1',
      name: 'Health Facility 1',
    },
    {
      id: '2',
      name: 'Health Facility 2',
    },
  ]),
);

export default {
  title: 'Forms/LinkedField',
  component: LinkedField,
  decorators: [
    Story => (
      <Container>
        <TranslationProvider>
          <Story />
        </TranslationProvider>
      </Container>
    ),
  ],
};

const BasicTemplate = args => {
  return (
    <MockedApi endpoints={endpoints}>
      <Form
        onSubmit={values => {
          console.log(values);
        }}
        render={() => (
          <div>
            <LinkedField
              component={AutocompleteField}
              name="villageId"
              linkedFieldName="nursingZoneId"
              endpoint="linkedField/healthCenter"
              suggester={mockVillageSuggester}
              label="Village"
            />
            <Field
              name="nursingZoneId"
              component={AutocompleteField}
              label="Health center"
              suggester={mockHealthFacilitySuggester}
            />
          </div>
        )}
      />
    </MockedApi>
  );
};

export const Basic = BasicTemplate.bind({});
