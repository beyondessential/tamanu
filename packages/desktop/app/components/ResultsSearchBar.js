import React from 'react';
import styled from 'styled-components';
import { useSuggester } from '../api';
import { Field, AutocompleteField, Form } from './Field';
import { Colors } from '../constants';
import { Heading3 } from './Typography';

const Container = styled.div`
  padding: 24px 30px 30px;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${Colors.outline};
`;

const Fields = styled.div`
  display: flex;
  align-items: center;

  > div {
    margin-right: 20px;
  }
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
      <Heading3 mb={2}>Lab results</Heading3>
      <Form
        onSubmit={() => {}}
        render={({ setFieldValue }) => (
          <>
            <Fields>
              <Field
                name="category"
                label="Test category"
                suggester={categorySuggester}
                component={AutocompleteField}
                onChange={event => {
                  setFieldValue('panel', null); // Clear other search field
                  setSearchParameters({ categoryId: event.target.value, panelId: null });
                }}
              />
              <Field
                name="panel"
                label="Test panel"
                suggester={panelSuggester}
                component={AutocompleteField}
                onChange={event => {
                  setFieldValue('category', null); // Clear other search field
                  setSearchParameters({ categoryId: null, panelId: event.target.value });
                }}
              />
            </Fields>
          </>
        )}
      />
    </Container>
  );
});
