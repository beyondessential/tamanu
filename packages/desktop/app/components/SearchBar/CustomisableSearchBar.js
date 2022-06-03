import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import { LargeButton, LargeOutlineButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 10px;
  letter-spacing: 0;
`;

const Section = styled.div`
  flex: 1;
  padding: 16px 24px 28px;
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
  RightSection = null,
}) => (
  <Container>
    <Section>
      <SectionLabel>{title}</SectionLabel>
      <Form
        onSubmit={values => {
          const params = values;
          // if filtering by date of birth exact, send the formatted date
          // to the server instead of the date object
          if (params.dateOfBirthExact) {
            params.dateOfBirthExact = moment(params.dateOfBirthExact)
              .utc()
              .format('YYYY-MM-DD');
          }

          onSearch(params);
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
                  Clear Search
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
    </Section>
    {RightSection && <RightSection />}
  </Container>
);
