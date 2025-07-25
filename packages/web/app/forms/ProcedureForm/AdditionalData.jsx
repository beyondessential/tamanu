import React, { useState } from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { AutocompleteField, Field, TranslatedText } from '../../components';
import { useSuggester } from '../../api/index.js';

const Container = styled.div`
  margin-bottom: 1.5rem;
`;

const Heading = styled(Typography)`
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  margin-bottom: 10px;
`;

const LeadText = styled(Typography)`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  margin-bottom: 10px;
  color: ${props => props.theme.palette.text.tertiary};
`;

export const AdditionalData = () => {
  const [selectedForm, setSelectedForm] = useState(null);
  const surveySuggester = useSuggester('survey');
  const onFormSelect = formId => {
    console.log('select');
    setSelectedForm(formId);
  };

  return (
    <Container>
      <Heading>
        <TranslatedText stringId="procedure.form.addionalDataHeading" fallback=" Additional data" />
      </Heading>
      <LeadText>
        <TranslatedText
          stringId="procedure.form.addionalDataText"
          fallback="Add any additional data to the procedure record by selecting a form below."
        />
      </LeadText>
      <Field
        name="formId"
        label={
          <TranslatedText
            stringId="procedure.form.additionalDataForm.label"
            fallback="Select form"
          />
        }
        component={AutocompleteField}
        suggester={surveySuggester}
        onChange={onFormSelect}
        data-testid="field-87c2z"
      />
    </Container>
  );
};
