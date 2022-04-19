import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { PrintLetterhead } from './Letterhead';
import { DateDisplay } from '../DateDisplay';

const PatientDetailsHeader = styled(Typography)`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 20px;
  text-align: center;
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
`;

const PatientDetailsSection = styled(Grid)`
  p.MuiTypography-root {
    margin-bottom: 20px;
  }
`;

const Text = styled(Typography)`
  font-size: 13px;
`;

const Footnote = styled(Typography)`
  font-size: 11px;
  font-style: italic;
`;

const Base64Image = ({ data, ...props }) => <img {...props} src={data} />;

const SizedBase64Image = styled(Base64Image)`
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  object-position: 0 0;
`;

const CertificateWrapper = styled.div`
  ${props =>
    props.watermarkSrc
      ? `background: linear-gradient(rgb(243, 245, 247,.9), rgb(243, 245, 247,.9)), url("${props.watermarkSrc}");
      background-repeat: no-repeat;
      background-attachment: scroll;
      background-position: center;
      background-size: 70%;`
      : ''}
`;

export const StyledLine = styled.div`
  flex: 1;
  height: 40px;
  border-bottom: 1px solid black;
`;

const Line = ({ text }) => {
  if (text) {
    return (
      <Box display="flex" alignItems="center">
        <div>{text}</div>
        <StyledLine />
      </Box>
    );
  }
  return <StyledLine />;
};

export const DeathCertificate = ({ patientData, certificateData }) => {
  const { firstName, lastName, dateOfBirth, sex, timeOfDeath, causeOfDeath } = patientData;

  const { title, subTitle, logo, watermark, footerImg, printedBy } = certificateData;

  const dateOfPrinting = new Date();

  return (
    <CertificateWrapper watermarkSrc={watermark}>
      <PrintLetterhead title={title} subTitle={subTitle} logoSrc={logo} />
      <PatientDetailsHeader>Cause of death certificate</PatientDetailsHeader>
      <PatientDetailsSection>
        <Text>
          <strong>First Name: </strong>
          {firstName}
        </Text>
        <Text>
          <strong>Last Name: </strong>
          {lastName}
        </Text>
        <Text>
          <strong>DOB: </strong>
          <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
        </Text>
        <Text>
          <strong>Sex: </strong>
          {sex}
        </Text>
        <Text>
          <strong>Date of death: </strong>
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
            <Text>
              I<br />
              Decease or condition directly leading to death*
            </Text>
            <br />
            <Text>
              Antecedent causes Morbid conditions, if any, giving rise to the above cause, stating
              the underlying condition last
            </Text>
          </Box>
          <Box>
            <Box>
              <Line text="(a)" />
              <Text>due to (or as a consequence of)</Text>
            </Box>
            <Box>
              <Line text="(b)" />
              <Text>due to (or as a consequence of)</Text>
            </Box>
            <Box>
              <Line text="(c)" />
              <Text>due to (or as a consequence of)</Text>
            </Box>
          </Box>
        </Grid>
        <Grid borderTop={1} px={3} py={2}>
          <Text>
            I<br />
            Other significant conditions contributing to the death but not related to the disease or
            condition causing it.
          </Text>
          <Box>
            <Line />
            <Line />
          </Box>
        </Grid>
      </Box>
      <Footnote>
        This does not mean the mode of dying, e.g heart failure, respiratory failure. It means the
        disease, injury, or complication that caused death.
      </Footnote>
      <Grid mt={3}>
        <Text>{`Printed by: ${printedBy || ''}`}</Text>
        <Text>
          <span>Printing date: </span>
          <DateDisplay date={new Date()} />
        </Text>
      </Grid>
      {footerImg && <SizedBase64Image data={footerImg} />}
    </CertificateWrapper>
  );
};
