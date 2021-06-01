import React, { memo, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import SearchIcon from '@material-ui/icons/Search';
import InputAdornment from '@material-ui/core/InputAdornment';

import { useLocalisation } from '../../../contexts/Localisation';
import {
  ConfigurableText,
  Button,
  Form,
  Field,
  TextField,
  DateField,
  AutocompleteField,
} from '../../../components';
import { Colors } from '../../../constants';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const DatePlaceholder = styled.div`
  font-size: 11pt;
  color: #8e8e8e;
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

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const Section = styled.div`
  padding: 24px;
`;

const RightSection = styled(Section)`
  border-left: 1px solid ${Colors.outline};
`;

export const CustomisablePatientSearchBar = ({ title, onSearch, fields, ...props }) => {
  // We can't use onSearch directly as formik will call it with an unwanted second param
  const handleSearch = useCallback(
    ({ village = {}, ...other }) => {
      const params = {
        ...other,
        // enforce dotted text identifier instead of a nested object
        'village.id': village.id,
      };
      onSearch(params);
    },
    [onSearch],
  );

  const { getLocalisation } = useLocalisation();

  const fieldElements = useMemo(
    () =>
      fields
        .map(([key, { suggesterKey, ...fieldProps } = {}]) =>
          getLocalisation(`fields.${key}.hidden`) === true ? null : (
            <Field
              name={key}
              key={key}
              placeholder={getLocalisation(`fields.${key}.longLabel`)}
              component={TextField}
              suggester={props[suggesterKey]}
              {...fieldProps}
            />
          ),
        )
        .filter(c => c),
    [getLocalisation, fields, props],
  );

  const renderSearchBar = React.useCallback(
    ({ submitForm }) => (
      <div>
        <SearchInputContainer>{fieldElements}</SearchInputContainer>
        <Button
          style={{ marginTop: 10 }}
          color="primary"
          variant="contained"
          onClick={submitForm}
          type="submit"
        >
          <PaddedSearchIcon />
          Search
        </Button>
      </div>
    ),
    [fields],
  );

  return (
    <Container>
      <Section>
        <SectionLabel>{title}</SectionLabel>
        <Form onSubmit={handleSearch} render={renderSearchBar} />
      </Section>
      <RightSection>
        <ScanFingerprintButton />
        <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
      </RightSection>
    </Container>
  );
};

const DumbPatientSearchBar = props => (
  <CustomisablePatientSearchBar
    title="Search for patients"
    fields={[
      ['firstName'],
      ['lastName'],
      ['culturalName'],
      ['villageId', { suggesterKey: 'villageSuggester', component: AutocompleteField }],
      ['displayId'],
      [
        'dobFrom',
        {
          component: DateField,
          InputProps: {
            startAdornment: (
              <InputAdornment position="start">
                <DatePlaceholder>DOB From</DatePlaceholder>
              </InputAdornment>
            ),
          },
        },
      ],
      [
        'dobTo',
        {
          component: DateField,
          InputProps: {
            startAdornment: (
              <InputAdornment position="start">
                <DatePlaceholder>DOB To</DatePlaceholder>
              </InputAdornment>
            ),
          },
        },
      ],
    ]}
    {...props}
  />
);

export const PatientSearchBar = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbPatientSearchBar);
