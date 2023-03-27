import React from 'react';
import styled from 'styled-components';

import { useSuggester } from '../api';
import { LocalisedField, AutocompleteField, Form } from './Field';
import { FormGrid } from './FormGrid';
import { Colors } from '../constants';

const Container = styled.div`
  padding: 2rem;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${Colors.outline};
`;

export const ResultsSearchBar = React.memo(({ setSearchParameters, patientId }) => {
  const panelSuggester = useSuggester('patientLabTestPanelTypes', {
    baseQueryParameters: { patientId },
  });
  const categorySuggester = useSuggester('patientLabTestCategories', {
    baseQueryParameters: { patientId },
  });

  return (
    <Container>
      <Form
        onSubmit={() => {}}
        render={({ setFieldValue }) => (
          <>
            <FormGrid columns={3}>
              <LocalisedField
                name="category"
                suggester={categorySuggester}
                component={AutocompleteField}
                onChange={event => {
                  setFieldValue('panel', null); // Clear other search field
                  setSearchParameters({ category: event.target.value, panel: null });
                }}
              />
              <LocalisedField
                name="panel"
                suggester={panelSuggester}
                component={AutocompleteField}
                onChange={event => {
                  setFieldValue('category', null); // Clear other search field
                  setSearchParameters({ category: null, panel: event.target.value });
                }}
              />
            </FormGrid>
          </>
        )}
      />
    </Container>
  );
});
