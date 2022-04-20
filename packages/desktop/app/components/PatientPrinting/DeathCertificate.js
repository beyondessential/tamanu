import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './Letterhead';
import { DateDisplay } from '../DateDisplay';
import { LocalisedText } from '../LocalisedText';

const CertificateWrapper = styled.div`
  padding: 10px 20px;

  ${props =>
    props.watermarkSrc
      ? `background: url("${props.watermarkSrc}");
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

const PatientDetailsSection = styled(Grid)`
  margin-bottom: 10px;

  p.MuiTypography-root {
    margin-bottom: 20px;
  }
`;

const Text = styled(Typography)`
  font-size: 14px;
`;

const StrongText = styled(Text)`
  font-weight: 600;
`;

const Footnote = styled(Typography)`
  margin-top: 10px;
  font-size: 12px;
  line-height: 15px;
  font-style: italic;
`;

const Base64Image = ({ data, ...props }) => <img {...props} src={data} alt="" />;

const SizedBase64Image = styled(Base64Image)`
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

// const LocalisedLabel = ({ name }) => (
//   <strong>
//     <LocalisedText path={`fields.${name}.longLabel`} />:{' '}
//   </strong>
// );

const LocalisedLabel = ({ name }) => <strong>{name}: </strong>;

export const DeathCertificate = ({ patientData, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, timeOfDeath, causeOfDeath } = patientData;

  const { title, subTitle, logo, watermark, footerImg2, printedBy } = certificateData;

  const dateOfPrinting = new Date();

  return (
    <CertificateWrapper watermarkSrc={watermark}>
      <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} />
      <Title variant="h3">Cause of death certificate</Title>
      <PatientDetailsSection>
        <Text>
          <LocalisedLabel name="firstName" />
          {firstName}
        </Text>
        <Text>
          <LocalisedLabel name="lastName" />
          {lastName}
        </Text>
        <Text>
          <LocalisedLabel name="dateOfBirth" />
          <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
        </Text>
        <Text>
          <LocalisedLabel name="sex" />
          {sex}
        </Text>
        <Text>
          <LocalisedLabel name="dateOfDeath" />
          <DateDisplay date={timeOfDeath} showDate={false} showExplicitDate />
        </Text>
        <Text>
          <strong>Place of death: </strong>
        </Text>
        <Text>
          <strong>Time of death: </strong>
          <DateDisplay date={timeOfDeath} showDate={false} showExplicitDate />
        </Text>
        <Text>
          <strong>Cause of death: </strong>
          {causeOfDeath}
        </Text>
        <Text>
          <strong>Printed by: </strong>
          {printedBy}
        </Text>
        <Text>
          <strong>Date of printing: </strong>
          <DateDisplay date={dateOfPrinting} showDate={false} showExplicitDate />
        </Text>
      </PatientDetailsSection>
      <Box border={1}>
        <Grid px={3} py={2}>
          <Box>
            <StrongText>
              I<br />
              Decease or condition directly leading to death*
            </StrongText>
            <br />
            <Text>
              Antecedent causes Morbid conditions, if any, giving rise to the above cause, stating
              the underlying condition last
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
          <StrongText>
            I<br />
            Other significant conditions contributing to the death but not related to the disease or
            condition causing it.
          </StrongText>
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
      {footerImg2 ? (
        <SizedBase64Image data={footerImg2} />
      ) : (
        <Box my={5}>
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
      )}
    </CertificateWrapper>
  );
};
