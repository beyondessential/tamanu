import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './PrintLetterhead';
import { DateDisplay } from '../DateDisplay';
import {
  LocalisedCertificateLabel as LocalisedLabel,
  CertificateLabel as Label,
} from './CertificateLabels';

const CertificateWrapper = styled.div`
  padding: 10px 20px;

  ${props =>
    props.watermarkSrc
      ? `background: linear-gradient(rgb(243, 245, 247,.9), rgb(243, 245, 247,.9)), url("${props.watermarkSrc}");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 70%;`
      : ''}
`;

const Title = styled(Typography)`
  font-size: 18px;
  line-height: 21px;
  font-weight: bold;
  margin-bottom: 40px;
  text-align: center;
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
`;

const Text = styled(Typography)`
  font-size: 14px;
`;

const StrongText = styled(Text)`
  font-weight: 600;
`;

const Footnote = styled(Typography)`
  margin-top: 10px;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  font-style: italic;
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
  min-height: 40px;

  hr {
    flex: 1;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: 1px solid black;
    margin: 0 0 0 10px;
  }
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

export const DeathCertificate = React.memo(({ patientData, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, causes, dateOfDeath, facility } = patientData;
  const { title, subTitle, logo, watermark, printedBy } = certificateData;
  const causeOfDeath = causes?.primary?.condition?.name;
  const dateOfPrinting = new Date();

  return (
    <CertificateWrapper watermarkSrc={watermark}>
      <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} />
      <Title variant="h3">Cause of death certificate</Title>
      <Grid mb={2}>
        <LocalisedLabel name="firstName">{firstName}</LocalisedLabel>
        <LocalisedLabel name="lastName">{lastName}</LocalisedLabel>
        <Label name="DOB">
          <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
        </Label>
        <LocalisedLabel name="sex">{sex}</LocalisedLabel>
        <Label name="Date of death">
          <DateDisplay date={dateOfDeath} showDate={false} showExplicitDate />
        </Label>
        <Label name="Place of death">{facility?.name}</Label>
        <Label name="Time of death">
          <DateDisplay date={dateOfDeath} showDate={false} showTime />
        </Label>
        <Label name="Cause of death">{causeOfDeath}</Label>
        <Label name="Printed by">{printedBy}</Label>
        <Label name="Date of printing">
          <DateDisplay date={dateOfPrinting} showDate={false} showExplicitDate />
        </Label>
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
              Morbid conditions, if any, giving rise to the above cause, stating the underlying
              condition last
            </Text>
          </Box>
          <Box>
            <Box>
              <FormLine helperText="due to (or as a consequence of)">
                <Text>(a)</Text>
              </FormLine>
            </Box>
            <Box>
              <FormLine helperText="due to (or as a consequence of)">
                <Text>(b)</Text>
              </FormLine>
            </Box>
            <Box>
              <FormLine helperText="due to (or as a consequence of)">
                <Text>(c)</Text>
              </FormLine>
            </Box>
          </Box>
        </Grid>
        <Grid borderTop={1} px={3} pt={2} pb={3}>
          <Box maxWidth="240px">
            <StrongText>
              I<br />
              Other significant conditions contributing to the death but not related to the disease
              or condition causing it.
            </StrongText>
          </Box>
          <Box>
            <FormLine />
            <FormLine />
          </Box>
        </Grid>
      </Box>
      <Footnote>
        This does not mean the mode of dying, e.g heart failure, respiratory failure. It means the
        disease, injury, or complication that caused death.
      </Footnote>
      <Box my={4}>
        <FormLine>
          <StrongText>Authorised by (print name):</StrongText>
        </FormLine>
        <Grid mt={5}>
          <FormLine>
            <StrongText>Signed:</StrongText>
          </FormLine>
          <FormLine>
            <StrongText>Date: </StrongText>
          </FormLine>
        </Grid>
      </Box>
    </CertificateWrapper>
  );
});
