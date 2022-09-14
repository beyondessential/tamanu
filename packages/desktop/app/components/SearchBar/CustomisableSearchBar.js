import React from 'react';
import styled from 'styled-components';
import { formatInTimeZone } from 'date-fns-tz';
import Box from '@material-ui/core/Box';
import { LargeButton, LargeOutlineButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  background: ${Colors.white};
  padding: 16px 30px 28px;
`;

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 10px;
  letter-spacing: 0;
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  gap: 9px;
`;

export const CustomisableSearchBar = ({
  title,
  onSearch,
  children,
  renderCheckField,
  initialValues = {},
}) => (
  <Container>
    <SectionLabel>{title}</SectionLabel>
    <Form
      onSubmit={values => {
        // if filtering by date of birth exact, send the formatted date
        // to the server instead of the date object
        const dateOfBirthExact = values.dateOfBirthExact
          ? formatInTimeZone(values.dateOfBirthExact, 'UTC', 'yyyy-MM-dd')
          : undefined;

        onSearch({ ...values, dateOfBirthExact });
      }}
      render={({ submitForm, clearForm }) => (
        <>
          <SearchInputContainer>{children}</SearchInputContainer>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            style={{ marginTop: 20 }}
          >
            {renderCheckField}
            <Box marginLeft="auto">
              <LargeOutlineButton style={{ marginRight: 12 }} onClick={clearForm}>
                Clear search
              </LargeOutlineButton>
              <LargeButton onClick={submitForm} type="submit">
                Search
              </LargeButton>
            </Box>
          </Box>
        </>
      )}
      initialValues={initialValues}
    />
  </Container>
);
