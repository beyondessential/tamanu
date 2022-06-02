import React from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { LargeButton, LargeOutlineButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${Colors.primary};
  margin-bottom: 5px;
`;

const Section = styled.div`
  padding: 24px;
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  gap: 10px 10px;
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
        onSubmit={values => onSearch(values)}
        render={({ submitForm, clearForm }) => (
          <>
            <SearchInputContainer>{children}</SearchInputContainer>
            <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
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
