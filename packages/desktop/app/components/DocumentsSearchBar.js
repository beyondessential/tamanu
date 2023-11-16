import React from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { Form, Field, SearchField } from './Field';
import { FormGrid } from './FormGrid';
import { FormSubmitButton, TextButton } from './Button';
import { Colors } from '../constants';

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
  padding-bottom: 10px;
  width: auto;
`;

const SubmitButton = styled(FormSubmitButton)`
  width: auto; /* Set width to auto */
`;

export const DocumentsSearchBar = ({ setSearchParameters }) => {
  const handleSubmit = values => {
    setSearchParameters(values);
  };

  return (
    <Container>
      <HeaderBar>
        <Typography variant="h3">Documents</Typography>
      </HeaderBar>
      <Form
        onSubmit={handleSubmit}
        render={({ clearForm, values }) => (
          <CustomFormGrid columns={5}>
            <Field name="type" label="Type" component={SearchField} size="small" />
            <Field name="documentOwner" label="Owner" component={SearchField} size="small" />
            <Field name="departmentName" label="Department" component={SearchField} size="small" />
            <SubmitButton type="submit" size="small">
              Search
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
              Clear
            </ClearButton>
          </CustomFormGrid>
        )}
      />
    </Container>
  );
};
