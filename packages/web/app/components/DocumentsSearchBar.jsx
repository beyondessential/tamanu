import React from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { DynamicSelectField, Form, Field, SearchField } from './Field';
import { FormGrid } from './FormGrid';
import { FormSubmitButton, TextButton } from './Button';
import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpeg', label: 'JPEG' },
];

const Container = styled.div`
  padding: 2rem;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${Colors.outline};
`;

const HeaderBar = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 1rem;
    font-weight: 500;
    color: ${props => props.theme.palette.text.primary};
  }
`;

const CustomFormGrid = styled(FormGrid)`
  grid-template-columns: repeat(3, 1fr) auto auto;
  align-items: end;
`;

const ClearButton = styled(TextButton)`
  text-decoration: underline;
  width: auto;
  margin-bottom: 10px;
`;

const SubmitButton = styled(FormSubmitButton)`
  width: auto;
`;

export const DocumentsSearchBar = ({ setSearchParameters }) => {
  const handleSubmit = async values => {
    setSearchParameters(values);
  };

  return (
    <Container>
      <HeaderBar>
        <Typography variant="h3">
          <TranslatedText
            stringId="patient.document.search.title"
            fallback="Documents search"
            data-test-id='translatedtext-gmqi' />
        </Typography>
      </HeaderBar>
      <Form
        onSubmit={handleSubmit}
        render={({ clearForm, values }) => (
          <CustomFormGrid columns={5}>
            <Field
              name="type"
              label={<TranslatedText
                stringId="document.type.label"
                fallback="Type"
                data-test-id='translatedtext-643t' />}
              component={DynamicSelectField}
              options={DOCUMENT_TYPE_OPTIONS}
              size="small"
              data-test-id='field-qkou' />
            <Field
              name="documentOwner"
              label={<TranslatedText
                stringId="document.owner.label"
                fallback="Owner"
                data-test-id='translatedtext-o60y' />}
              component={SearchField}
              size="small"
              data-test-id='field-ahct' />
            <Field
              name="departmentName"
              label={<TranslatedText
                stringId="general.department.label"
                fallback="Department"
                data-test-id='translatedtext-wlxp' />}
              component={SearchField}
              size="small"
              data-test-id='field-m2ux' />
            <SubmitButton type="submit" size="small">
              <TranslatedText
                stringId="general.action.search"
                fallback="Search"
                data-test-id='translatedtext-bzuy' />
            </SubmitButton>
            <ClearButton
              onClick={() => {
                if (Object.keys(values).length === 0) return;
                setSearchParameters({});
                clearForm();
              }}
              size="small"
            >
              <TranslatedText
                stringId="general.action.clearSearch"
                fallback="Clear"
                data-test-id='translatedtext-71fw' />
            </ClearButton>
          </CustomFormGrid>
        )}
      />
    </Container>
  );
};
