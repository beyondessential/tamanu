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

const ScanFingerprintButton = styled(FingerprintIcon)`
  display: block;
  background: #ffcc24;
  padding: 12px 10px;
`;

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
`;

const PaddedSearchIcon = styled(SearchIcon)`
  padding-right: 3px;
`;

const Section = styled.div`
  padding: 30px;
  border-left: ${({ isFirstSection }) => (isFirstSection ? `0px` : `1px solid #dedede`)};
  margin: ${({ alignContent }) => (alignContent === 'center' ? 'auto' : '0px')};
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
      <Section isFirstSection>
        <SectionLabel>Search for patients</SectionLabel>
        <Form onSubmit={handleSearch} render={renderSearchBar} />
      </Section>
      <Section alignContent="center">
        <div style={{ margin: 'auto' }}>
          <ScanFingerprintButton fontSize="large" />
        </div>
        <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
      </Section>
    </Container>
  );
});
