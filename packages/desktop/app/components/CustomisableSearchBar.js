import React, { memo, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
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

const ScanFingerprintIcon = styled(FingerprintIcon)`
  color: ${Colors.secondary};
`;

const ScanFingerprintButtonContainer = styled.div`
  text-align: center;
  margin: auto;

  svg {
    font-size: 46px;
  }
`;

const ScanFingerprintButton = memo(() => (
  <ScanFingerprintButtonContainer>
    <ScanFingerprintIcon fontSize="large" />
  </ScanFingerprintButtonContainer>
));

const ScanFingerprintLabel = styled.div`
  font-size: 12px;
  text-align: center;
  color: ${Colors.primary};
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

const RightSection = styled(Section)`
  border-left: 1px solid ${Colors.outline};
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  grid-row-gap: 10px;

  .MuiInputBase-input {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  fieldset {
    border-radius: 0;
    border-right: none;
  }

  > :first-child,
  > :nth-child(5n) {
    fieldset {
      border-radius: 4px 0 0 4px;
    }
  }

  > :nth-child(4n),
  > :last-child {
    fieldset {
      border-right: 1px solid ${Colors.outline};
      border-radius: 0 4px 4px 0;
    }
  }

  button {
    border-radius: 0;
  }
`;

export const CustomisableSearchBar = ({
  title,
  onSearch,
  fields,
  renderCheckField,
  initialValues = {},
  shouldRenderScanFingerprint = true,
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
              ...fieldProps
            } = {},
          ]) =>
            getLocalisation(`fields.${key}.hidden`) === true ? null : (
              <Field
                name={key}
                key={key}
                placeholder={getLocalisation(`fields.${key}.${localisationLabel}`) || placeholder}
                component={component}
                {...fieldProps}
              />
            ),
        )
        .filter(c => c),
    [getLocalisation, fields],
  );

  const renderSearchBar = useCallback(
    ({ submitForm, clearForm }) => (
      <>
        <SearchInputContainer>{fieldElements}</SearchInputContainer>
        <Box display="flex" alignItems="center" justifyContent="space-between" pt={2}>
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
      {shouldRenderScanFingerprint ? (
        <RightSection>
          <ScanFingerprintButton />
          <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
        </RightSection>
      ) : null}
    </Container>
  );
};
