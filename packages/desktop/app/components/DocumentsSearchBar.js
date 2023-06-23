import React from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import { Form, Field, SearchField } from './Field';
import { FormGrid } from './FormGrid';
import { LargeButton, LargeOutlineButton } from './Button';
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

const renderSearchBar = ({ submitForm, clearForm }) => (
  <>
    <FormGrid columns={3}>
      <Field name="type" label="Type" component={SearchField} />
      <Field name="documentOwner" label="Owner" component={SearchField} />
      <Field name="departmentName" label="Department" component={SearchField} />
    </FormGrid>
    <Box display="flex" alignItems="center" justifyContent="flex-end" mt={2}>
      <LargeOutlineButton onClick={clearForm} style={{ marginRight: 12 }}>
        Clear search
      </LargeOutlineButton>
      <LargeButton onClick={submitForm} type="submit">
        Search
      </LargeButton>
    </Box>
  </>
);

export const DocumentsSearchBar = ({ setSearchParameters }) => (
  <Container>
    <HeaderBar>
      <Typography variant="h3">Documents search</Typography>
    </HeaderBar>
    <Form onSubmit={values => setSearchParameters(values)} render={renderSearchBar} />
  </Container>
);
