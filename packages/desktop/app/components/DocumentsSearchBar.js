import React from 'react';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import { ButtonRow } from './ButtonRow';
import { Form, Field, TextField } from './Field';
import { FormGrid } from './FormGrid';
import { Button, LargeButton, LargeOutlineButton } from './Button';

const Container = styled.div`
  padding: 1rem 2rem 1rem 2rem;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
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
      <Field name="type" placeholder="Type" component={TextField} />
      <Field name="documentOwner" placeholder="Owner" component={TextField} />
      <Field name="departmentName" placeholder="Department" component={TextField} />
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
