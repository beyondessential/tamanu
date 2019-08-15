import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import SearchIcon from '@material-ui/icons/Search';
import { Form, Field, TextField } from './Field';
import { Button } from './Button';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  border: 1px solid #dedede;
  background: #fff;
`;

const ScanFingerprintIcon = styled(FingerprintIcon)`
  color: #ffcc24;
`;

const ScanFingerprintButtonContainer = styled.div`
  text-align: center;
  margin: auto;
`;

const ScanFingerprintButton = memo(() => (
  <ScanFingerprintButtonContainer>
    <ScanFingerprintIcon fontSize="large" />
  </ScanFingerprintButtonContainer>
));

const ScanFingerprintLabel = styled.div`
  font-size: 12px;
  text-align: center;
  color: #326699;
`;

const SectionLabel = styled.div`
  font-size: 16px;
  color: #326699;
  margin-bottom: 15px;
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 1fr 1fr;
  grid-column-gap: 7px;
`;

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const Section = styled.div`
  padding: 30px;
`;

const RightSection = styled(Section)`
  border-left: 1px solid #dedede;
  margin: auto;
`;

const renderSearchBar = ({ submitForm }) => (
  <SearchInputContainer>
    <Field component={TextField} label="First name" name="firstName" />
    <Field component={TextField} label="Last name" name="lastName" />
    <Field component={TextField} label="Cultural/Traditional name" name="culturalName" />
    <Field component={TextField} label="Health ID" name="healthId" />
    <Button color="primary" variant="contained" onClick={submitForm}>
      <PaddedSearchIcon />
      Search
    </Button>
  </SearchInputContainer>
);

export const PatientSearchBar = memo(({ onSearch }) => {
  // We can't use onSearch directly as formik will call it with an unwanted second param
  const handleSearch = useCallback(newParams => onSearch(newParams));

  return (
    <Container>
      <Section>
        <SectionLabel>Search for patients</SectionLabel>
        <Form onSubmit={handleSearch} render={renderSearchBar} />
      </Section>
      <RightSection>
        <ScanFingerprintButton />
        <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
      </RightSection>
    </Container>
  );
});
