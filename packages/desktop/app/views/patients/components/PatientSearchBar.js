import React, { memo, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import SearchIcon from '@material-ui/icons/Search';

import { useFlags } from '../../../contexts/FeatureFlags';
import {
  ConfigurableText,
  Button,
  Form,
  Field,
  TextField,
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
  grid-template-columns: 2fr 2fr 2.5fr 2fr 2fr 1.5fr;

  .MuiInputBase-input {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  fieldset {
    border-radius: 0;
    border-right: none;
  }

  > :first-child {
    fieldset {
      border-radius: 4px 0 0 4px;
    }
  }

  button {
    border-radius: 0;
  }

  :last-child {
    button {
      border-radius: 0 4px 4px 0;
    }
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

  const { getFlag } = useFlags();

  const fieldElements = useMemo(() =>
    fields
      .map(([key, { suggesterKey, ...fieldProps } = {}]) => (
        getFlag(`patientFieldOverrides.${key}.hidden`) === true ? null : (
          <Field
            name={key}
            key={key}
            placeholder={getFlag(`patientFieldOverrides.${key}.longLabel`)}
            component={TextField}
            suggester={props[suggesterKey]}
            {...fieldProps}
          />
        )
      ))
      .filter(c => c),
    [getFlag, fields, props],
  );

  const renderSearchBar = React.useCallback(
    ({ submitForm }) => (
      <SearchInputContainer>
        {fieldElements}
        <Button color="primary" variant="contained" onClick={submitForm} type="submit">
          <PaddedSearchIcon />
          Search
        </Button>
      </SearchInputContainer>
    ),
    [fields],
  );

  return (
    <Container>
      <Section>
        <SectionLabel>{title}</SectionLabel>
        <Form
          onSubmit={handleSearch}
          render={renderSearchBar}
        />
      </Section>
      <RightSection>
        <ScanFingerprintButton />
        <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
      </RightSection>
    </Container>
  );
};

const DumbPatientSearchBar = (props) => (
  <CustomisablePatientSearchBar
    title="Search for patients"
    fields={[
      ['firstName'],
      ['lastName'],
      ['culturalName'],
      ['villageName', { suggesterKey: 'villageSuggester', component: AutocompleteField, name: 'villageId' }],
      ['displayId'],
    ]}
    {...props}
  />
);

export const PatientSearchBar = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbPatientSearchBar);
