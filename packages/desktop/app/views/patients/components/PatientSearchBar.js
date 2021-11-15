import React, { memo, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import SearchIcon from '@material-ui/icons/Search';
import moment from 'moment';

import { useLocalisation } from '../../../contexts/Localisation';
import { Button, Form, Field, TextField, DateField, AutocompleteField } from '../../../components';
import { Colors } from '../../../constants';
import { useApi } from '../../../api';
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

const GENERAL_FIELDS = {
  firstName: ['firstName'],
  lastName: ['lastName'],
  culturalName: ['culturalName'],
  villageId: ['villageId', { suggesterKey: 'villageSuggester', component: AutocompleteField }],
  displayId: ['displayId'],
  dateOfBirthFrom: ['dateOfBirthFrom', { localisationLabel: 'shortLabel', component: DateField }],
  dateOfBirthTo: ['dateOfBirthTo', { localisationLabel: 'shortLabel', component: DateField }],
  dateOfBirthExact: [
    'dateOfBirthExact',
    { localisationLabel: 'shortLabel', placeholder: 'DOB exact', component: DateField },
  ],
};

export const CustomisablePatientSearchBar = ({
  title,
  onSearch,
  fields,
  initialValues = {},
  ...props
}) => {
  const { getLocalisation } = useLocalisation();

  const fieldElements = useMemo(
    () =>
      fields
        .map(
          ([
            key,
            { suggesterKey, placeholder, localisationLabel = 'longLabel', ...fieldProps } = {},
          ]) =>
            getLocalisation(`fields.${key}.hidden`) === true ? null : (
              <Field
                name={key}
                key={key}
                placeholder={getLocalisation(`fields.${key}.${localisationLabel}`) || placeholder}
                component={TextField}
                suggester={props[suggesterKey]}
                {...fieldProps}
              />
            ),
        )
        .filter(c => c),
    [getLocalisation, fields, props],
  );

  const renderSearchBar = useCallback(
    ({ submitForm, resetForm }) => (
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
        <Button
          style={{ marginTop: 10, marginLeft: '1rem' }}
          onClick={() => resetForm()}
          variant="outlined"
        >
          Clear search
        </Button>
      </div >
    ),
    [fields],
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
      <RightSection>
        <ScanFingerprintButton />
        <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
      </RightSection>
    </Container>
  );
};

const DEFAULT_FIELDS = [
  'firstName',
  'lastName',
  'culturalName',
  'villageId',
  'displayId',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
];

export const PatientSearchBar = ({ onSearch, fields = DEFAULT_FIELDS, ...props }) => {
  const api = useApi();
  const searchFields = fields.map(field =>
    typeof field === 'string' ? GENERAL_FIELDS[field] : field,
  );

  const handleSearch = values => {
    const params = {
      ...values,
    };
    // if filtering by date of birth exact, send the formatted date
    // to the server instead of the date object
    if (params.dateOfBirthExact) {
      params.dateOfBirthExact = moment(values.dateOfBirthExact)
        .utc()
        .format('YYYY-MM-DD');
    }
    onSearch(params);
  };
  return (
    <CustomisablePatientSearchBar
      title="Search for patients"
      fields={searchFields}
      onSearch={handleSearch}
      villageSuggester={fields.includes('villageId') ? new Suggester(api, 'village') : null}
      {...props}
    />
  );
};
