import React from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { Colors } from '../../constants';
import { PrintLetterhead } from '../Print/Letterhead';
import { DateDisplay } from '../DateDisplay';

const PatientDetailsHeader = styled(Typography)`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
`;

const TwoColumnContainer = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const Base64Image = ({ data, mediaType = 'image/jpeg', ...props }) => (
  <img {...props} src={`data:${mediaType};base64,${data}`} alt="" />
);

const SizedBase64Image = styled(Base64Image)`
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  object-position: 0 0;
`;

const CertificateWrapper = styled.div`
  ${props =>
    props.watermark && props.watermarkType
      ? `background: linear-gradient(rgb(243, 245, 247,.9), rgb(243, 245, 247,.9)), url("data:${props.watermarkType};base64,${props.watermark}");
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
  console.log('patientData', patientData);
  console.log('certificateData', certificateData);

  const { firstName, lastName, dateOfBirth, sex, timeOfDeath, causeOfDeath } = patientData;

  const {
    title,
    subTitle,
    logo,
    logoType,
    watermark,
    watermarkType,
    footerImg,
    footerImgType,
    printedBy,
  } = certificateData;

  const dateOfPrinting = new Date();

  return (
    <CertificateWrapper watermark={watermark} watermarkType={watermarkType}>
      <PrintLetterhead title={title} subTitle={subTitle} logo={logo} logoType={logoType} />
      <PatientDetailsHeader>Cause of death certificate</PatientDetailsHeader>
      <TwoColumnContainer>
        <p>First Name: {firstName}</p>
        <p>Last Name: {lastName}</p>
        <p>
          DOB: <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
        </p>
        <p>Sex: {sex}</p>
        <p>
          Date of death: <DateDisplay date={timeOfDeath} showDate={false} showExplicitDate />
        </p>
        <p>Place of death: </p>
        <p>
          Time of death: <DateDisplay date={timeOfDeath} showDate={false} showExplicitDate />
        </p>
        <p>Cause of death: {causeOfDeath}</p>
        <p>Printed by: {printedBy}</p>
        <p>
          Date of printing: <DateDisplay date={dateOfPrinting} showDate={false} showExplicitDate />
        </p>
      </TwoColumnContainer>
      <Box border={1}>
        <TwoColumnContainer p={3}>
          <Box>
            <p>I Decease or condition directly leading to death</p>
            <p>
              Antecedent causes Morbid conditions, if any, giving rise to the above cause, stating
              the underlying condition last
            </p>
          </Box>
          <Box>
            <Box>
              <Line text="(a)" />
              <p>due to (or as a consequence of)</p>
            </Box>
            <Box>
              <Line text="(b)" />
              <p>due to (or as a consequence of)</p>
            </Box>
            <Box>
              <Line text="(c)" />
              <p>due to (or as a consequence of)</p>
            </Box>
          </Box>
        </TwoColumnContainer>
        <TwoColumnContainer borderTop={1} p={3}>
          <Box>
            I Other significant conditions contributing to the death but not related to the disease
            or condition causing it.
          </Box>
          <Box>
            <Line />
            <Line />
          </Box>
        </TwoColumnContainer>
      </Box>

      <TwoColumnContainer>
        <p>{`Printed by: ${printedBy || ''}`}</p>
        <p>
          <span>Printing date: </span>
          <DateDisplay date={new Date()} />
        </p>
      </TwoColumnContainer>
      {footerImg ? <SizedBase64Image data={footerImg} mediaType={footerImgType} /> : null}
    </CertificateWrapper>
  );
};
