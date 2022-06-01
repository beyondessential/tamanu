import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';

import { useLocalisation } from '../contexts/Localisation';
import { LargeButton, LargeOutlineButton } from './Button';
import { Form, Field, TextField } from './Field';
import { Colors } from '../constants';

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
  fields,
  renderCheckField,
  initialValues = {},
  RightSection = null,
}) => {
  const { getLocalisation } = useLocalisation();

  const fieldElements = useMemo(
    () =>
      fields
        .map(
          ([
            key,
            {
              placeholder,
              localisationLabel = 'longLabel',
              component = TextField,
              label,
              ...fieldProps
            } = {},
          ]) => {
            return getLocalisation(`fields.${key}.hidden`) === true ? null : (
              <Field
                name={key}
                key={key}
                placeholder={placeholder}
                label={getLocalisation(`fields.${key}.${localisationLabel}`) || label}
                component={component}
                {...fieldProps}
              />
            );
          },
        )
        .filter(c => c),
    [getLocalisation, fields],
  );

  const renderSearchBar = useCallback(
    ({ submitForm, clearForm }) => (
      <>
        <SearchInputContainer>{fieldElements}</SearchInputContainer>
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
    ),
    [fieldElements, renderCheckField],
  );

  return (
    <Container>
      <Section>
        <SectionLabel>{title}</SectionLabel>
        <Form
          onSubmit={values => onSearch(values)}
          render={renderSearchBar}
          initialValues={initialValues}
        />
      </Section>
      {RightSection && <RightSection />}
    </Container>
  );
};
