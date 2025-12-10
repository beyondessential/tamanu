import React from 'react';
import styled from 'styled-components';
import { Form } from '@tamanu/ui-components';
import { AutocompleteField, Field, Heading4 } from '../../app/components';
import { MockedApi } from '../utils/mockedApi';
import { LinkedField } from '../../app/components/Field/LinkedField';
import { TranslationProvider } from '../../app/contexts/Translation';
import { createDummySuggester, mapToSuggestions } from '../utils';

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const StyledLinkedField = styled(LinkedField)`
  margin-bottom: 1rem;
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
  title: 'Form Fields/LinkedField',
  component: LinkedField,
  decorators: [
    (Story) => (
      <Container>
        <TranslationProvider>
          <Story />
        </TranslationProvider>
      </Container>
    ),
  ],
};

const BasicTemplate = () => {
  return (
    <MockedApi endpoints={endpoints}>
      <Form
        onSubmit={async () => {}}
        render={() => (
          <div>
            <Heading4>Linked fields pre-populating Health center on village change:</Heading4>
            <StyledLinkedField
              component={AutocompleteField}
              name="villageId"
              linkedFieldName="nursingZoneId"
              endpoint="linkedField/healthCenter"
              suggester={mockVillageSuggester}
              label="Village"
            />
            <Field
              name="healthCenterId"
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
