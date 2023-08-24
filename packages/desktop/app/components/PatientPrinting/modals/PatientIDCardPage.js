import React, { useEffect } from 'react';
import styled from 'styled-components';

import { useLocalisation } from '../../../contexts/Localisation';
import { useElectron } from '../../../contexts/Electron';
import { SEX_VALUE_INDEX } from '../../../constants';
import { DateDisplay } from '../../DateDisplay';

import { PatientBarcode } from '../printouts/reusable/PatientBarcode';
import { PrintPortal } from '../PrintPortal';

const cardDimensions = {
  width: 85.6,
  height: 53.92,
};

const Card = styled.div`
  display: flex;
  flex-direction: column;
  width: ${cardDimensions.width}mm;
  height: ${cardDimensions.height}mm;
  padding-left: ${p => p.leftPadding || '0.2'}rem;
  padding-right: 0.2rem;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  color: ${p => p.colorOption};
  ${p => p.shrinkFactor !== 1 && `transform: scale(${p.shrinkFactor});`}
  ${p => p.shrinkFactor !== 1 && `transform-origin: left top;`}
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 5mm;
  margin-left: 5mm;
`;

// No display, just a placeholder for letterhead.
const TopBar = styled.div`
  width: 100%;
  height: 10.6mm;
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: row;
  height: 28.6mm;
  overflow-y: hidden;
`;

const PhotoContainer = styled.div`
  display: block;
  width: 1in;
  padding-left: 2mm;
  padding-right: 2mm;
  padding-top: 1mm;
`;

const BarcodeRow = styled.div`
  height: 6.3mm;
  padding: 1mm;
  margin-left: calc(1in + 4mm);
`;

// No display, just a placeholder for letterhead.
const BottomBar = styled.div`
  width: 100%;
  height: 3.5mm;
  margin-top: auto;
`;

const DetailsValue = styled.span`
  font-weight: bold;
`;

const DetailsKey = styled.span`
  width: 23mm;
  font-weight: bold;
`;

const InfoRow = styled.div`
  line-height: 4mm;
  font-size: 2.4mm;
  display: flex;
  flex-direction: row;
`;

const DetailsRow = ({ name, value }) => {
  const { getLocalisation } = useLocalisation();
  const label = getLocalisation(`fields.${name}.shortLabel`);
  return (
    <InfoRow>
      <DetailsKey>{`${label}: `}</DetailsKey>
      <DetailsValue>{value}</DetailsValue>
    </InfoRow>
  );
};

const PhotoLabel = ({ patient }) => (
  <div style={{ fontSize: '2.2mm', textAlign: 'center' }}>
    <strong style={{ margin: 'auto' }}>
      {` ${patient.title ? `${patient.title}. ` : ''}${patient.firstName} ${patient.lastName} `}
    </strong>
  </div>
);

const Base64Image = ({ data, mediaType = 'image/jpeg', ...props }) => (
  <img {...props} src={`data:${mediaType};base64,${data}`} alt="" />
);

const PhotoFrame = styled.div`
  width: 1in;
  height: 1.3in;
`;

const SizedBase64Image = styled(Base64Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PatientPhoto = ({ imageData }) => (
  <PhotoFrame>
    {imageData ? <SizedBase64Image mediaType="image/jpeg" data={imageData} /> : null}
  </PhotoFrame>
);

export const PatientIDCardPage = ({ patient, imageData, pageProps }) => {
  const { printPage } = useElectron();
  const { printSelection } = pageProps;
  const showPhoto = printSelection === 'default' || printSelection === 'photo';
  const showText = printSelection === 'default' || printSelection === 'text';

  const { shrinkBy } = pageProps;
  const shrinkFactor = (100 - shrinkBy) / 100;

  useEffect(() => {
    printPage({
      landscape: true,
      margins: {
        marginType: 'none',
      },
      pageSize: {
        // it expects dimensions in microns
        height: cardDimensions.width * 1000,
        width: cardDimensions.height * 1000,
      },
    });
  });

  return (
    <PrintPortal>
      <Card {...pageProps} shrinkFactor={shrinkFactor}>
        <TopBar />
        <MainSection>
          <PhotoContainer style={{ visibility: showPhoto ? 'visible' : 'hidden' }}>
            <PatientPhoto imageData={imageData} />
            <PhotoLabel patient={patient} />
          </PhotoContainer>
          <Details style={{ visibility: showText ? 'visible' : 'hidden' }}>
            <DetailsRow name="displayId" value={patient.displayId} />
            <DetailsRow name="lastName" value={patient.lastName} />
            <DetailsRow name="firstName" value={patient.firstName} />
            <DetailsRow name="dateOfBirth" value={DateDisplay.rawFormat(patient.dateOfBirth)} />
            <DetailsRow name="sex" value={SEX_VALUE_INDEX[patient.sex].label} />
          </Details>
        </MainSection>
        <BarcodeRow style={{ visibility: showText ? 'visible' : 'hidden' }}>
          <PatientBarcode patient={patient} width="43mm" height="5.9mm" />
        </BarcodeRow>
        <BottomBar />
      </Card>
    </PrintPortal>
  );
};
