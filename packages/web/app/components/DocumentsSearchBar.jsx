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
  const handleSubmit = values => {
    setSearchParameters(values);
  };

  return (
    <Container>
      <HeaderBar>
        <Typography variant="h3">
          <TranslatedText stringId="patient.document.search.title" fallback="Documents search" />
        </Typography>
      </HeaderBar>
      <Form
        onSubmit={handleSubmit}
        render={({ clearForm, values }) => (
          <CustomFormGrid columns={5}>
            <Field name="type" label="Type" component={DynamicSelectField} options={DOCUMENT_TYPE_OPTIONS} size="small" />
            <Field name="documentOwner" label={<TranslatedText stringId="document.owner.label" fallback="Owner" />} component={SearchField} size="small" />
            <Field name="departmentName" label={<TranslatedText stringId="general.department.label" fallback="Department" />} component={SearchField} size="small" />
            <SubmitButton type="submit" size="small">
              <TranslatedText stringId="general.action.search" fallback="Search" />
            </SubmitButton>
            <ClearButton
              onClick={() => {
                if (Object.keys(values).length === 0) return;
                setSearchParameters({});
                setTimeout(() => {
                  clearForm();
                }, 0);
              }}
              size="small"
            >
              <TranslatedText stringId="general.action.clearSearch" fallback="Clear search" />
            </ClearButton>
          </CustomFormGrid>
        )}
      />
    </Container>
  );
};
