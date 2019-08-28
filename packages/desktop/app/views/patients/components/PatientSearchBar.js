import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import SearchIcon from '@material-ui/icons/Search';
import { Button, Form, Field, TextField } from '../../../components';

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
  color: #326699;
`;

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #326699;
  margin-bottom: 5px;
`;

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 1fr 1fr;

  > div {
    :hover {
      border-right: 1px solid #326699;
    }

    :focus-within {
      border-right: 2px solid #326699;
    }
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
  padding: 30px;
`;

const RightSection = styled(Section)`
  border-left: 1px solid #dedede;
`;

const renderSearchBar = ({ submitForm }) => (
  <SearchInputContainer>
    <Field component={TextField} placeholder="First name" name="firstName" />
    <Field component={TextField} placeholder="Last name" name="lastName" />
    <Field component={TextField} placeholder="Cultural/Traditional name" name="culturalName" />
    <Field component={TextField} placeholder="Health ID" name="healthId" />
    <Button color="primary" variant="contained" onClick={submitForm}>
      <PaddedSearchIcon />
      Search
    </Button>
  </SearchInputContainer>
);

export const PatientSearchBar = memo(({ onSearch }) => {
  // We can't use onSearch directly as formik will call it with an unwanted second param
  const handleSearch = useCallback(newParams => onSearch(newParams), [onSearch]);

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
