import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './PrintLetterhead';
import { DateDisplay } from '../DateDisplay';
import {
  LocalisedCertificateLabel as LocalisedLabel,
  CertificateLabel as Label,
} from './CertificateLabels';
import { CertificateWrapper } from './CertificateWrapper';

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
`;

const Text = styled(Typography)`
  font-size: 12px;
`;

const StrongText = styled(Text)`
  font-weight: 600;
`;

const Footnote = styled(Typography)`
  margin-top: 10px;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  font-style: italic;
`;

const DataImage = styled(({ data, ...props }) => <img {...props} src={data} alt="" />)`
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  object-position: 0 0;
`;

const FormLineContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

const FormLineInner = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 10px;
  min-height: 30px;

  hr {
    flex: 1;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: 1px solid black;
    margin: 0 0 0 10px;
  }
`;

const FormFieldUnderline = styled(Text)`
  border-bottom: 1px solid black;
  width: 100%;
  margin: 0 15px 0 10px;
  font-size: 15px;
`;

const UnderlinedFormHelper = styled(Text)`
  font-weight: 500;
`;

const FormLine = ({ children, helperText }) => {
  return (
    <FormLineContainer>
      <FormLineInner>
        {children}
        <hr />
      </FormLineInner>
      <Text>{helperText}</Text>
    </FormLineContainer>
  );
};

const UnderlinedFormField = ({ label, children, helperText }) => {
  return (
    <FormLineContainer>
      <FormLineInner>
        <Text>{label}</Text>
        <FormFieldUnderline>{children}</FormFieldUnderline>
      </FormLineInner>
      <UnderlinedFormHelper>{helperText}</UnderlinedFormHelper>
    </FormLineContainer>
  );
};

const getCauseName = cause => cause?.condition?.name;

export const DeathCertificate = React.memo(({ patientData, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, causes, dateOfDeath, facility } = patientData;
  const { title, subTitle, logo, watermark, printedBy, deathCertFooterImg } = certificateData;
  const causeOfDeath = getCauseName(causes?.primary);
  const antecedentCause1 = getCauseName(causes?.antecedent1);
  const antecedentCause2 = getCauseName(causes?.antecedent2);
  const dateOfPrinting = new Date();

  return (
    <CertificateWrapper watermarkSrc={watermark}>
      <PrintLetterhead
        title={title}
        subTitle={subTitle}
        logoSrc={logo}
        pageTitle="Cause of Death Certificate"
      />
      <Grid mb={2}>
        <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
        <Label name="Date of death">
          <DateDisplay date={dateOfDeath} showDate={false} showExplicitDate />
        </Label>
        <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
        <Label name="Time of death">
          <DateDisplay date={dateOfDeath} showDate={false} showTime />
        </Label>
        <Label name="DOB">
          <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
        </Label>
        <Label name="Date of printing">
          <DateDisplay date={dateOfPrinting} showDate={false} showExplicitDate />
        </Label>
        <LocalisedLabel name="sex">{sex}</LocalisedLabel>
        <Label name="Printed by">{printedBy}</Label>
        <Label name="Place of death">{facility?.name}</Label>
      </Grid>
      <Box border={1}>
        <Grid px={3} py={2}>
          <Box maxWidth="240px">
            <StrongText>
              I<br />
              Decease or condition directly leading to death*
            </StrongText>
            <br />
            <br />

            <StrongText>Antecedent causes</StrongText>
            <Text>
              Morbid conditions, giving rise to the above cause, stating the underlying condition
              last
            </Text>
          </Box>
          <Box>
            <Box>
              <UnderlinedFormField label="(a)" helperText="due to (or as a consequence of)">
                {causeOfDeath}
              </UnderlinedFormField>
            </Box>
            <Box>
              <UnderlinedFormField label="(b)" helperText="due to (or as a consequence of)">
                {antecedentCause1}
              </UnderlinedFormField>
            </Box>
            <Box>
              <UnderlinedFormField label="(c)">{antecedentCause2}</UnderlinedFormField>
            </Box>
          </Box>
        </Grid>
        <Grid borderTop={1} px={3} pt={2} pb={3}>
          <Box maxWidth="240px">
            <StrongText>
              II
              <br />
              Other significant conditions contributing to the death but not related to the disease
              or condition causing it.
            </StrongText>
          </Box>
          <Box>
            {causes?.contributing?.map(cause => (
              <UnderlinedFormField>{getCauseName(cause)}</UnderlinedFormField>
            ))}
          </Box>
        </Grid>
      </Box>
      <Footnote>
        * This does not mean the mode of dying, e.g heart failure, respiratory failure. It means the
        disease, injury, or complication that caused death.
      </Footnote>
      <Box my={4}>
        {deathCertFooterImg ? (
          <DataImage data={deathCertFooterImg} />
        ) : (
          <>
            <FormLine>
              <StrongText>Authorised by (print name):</StrongText>
            </FormLine>
            <Grid mt={4}>
              <FormLine>
                <StrongText>Signed:</StrongText>
              </FormLine>
              <FormLine>
                <StrongText>Date: </StrongText>
              </FormLine>
            </Grid>
          </>
        )}
      </Box>
    </CertificateWrapper>
  );
});
