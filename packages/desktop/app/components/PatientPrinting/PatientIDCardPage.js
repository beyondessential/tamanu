import React from 'react';
import styled from 'styled-components';


import { SEX_VALUE_INDEX, Colors } from '../../constants';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';

import { printPage, PrintPortal } from '../../print';
import { TamanuLogo } from '../TamanuLogo';

const cardDimensions = {
  width: 85.6,
  height: 53.92,
};

const Card = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.2rem;
  width: ${cardDimensions.width}mm;
  height: ${cardDimensions.height}mm;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 0.3rem;
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
`

const DetailsKey = styled.span`
  width: 23mm;
  font-weight: bold;
`;

const DetailsRow = ({ label, value }) => (
  <div style={{ lineHeight: '4mm', fontSize: '2.4mm', display: 'flex', flexDirection: 'row' }}>
    <DetailsKey>{`${label}: `}</DetailsKey>
    <DetailsValue>{value}</DetailsValue>
  </div>
);

const MRIDRow = ({ id }) => (
  <div style={{ fontSize: '3.3mm', paddingBottom: '0.1rem', display: 'flex', flexDirection: 'row' }}>
    <strong style={{ width: '23mm' }}>{`MRID: `}</strong> <strong>{id}</strong>
  </div>
);

const PhotoLabel = ({ patient }) => (
  <div style={{ fontSize: '2.2mm', textAlign: 'center' }}>
    <strong style={{ margin: 'auto' }}> {`${patient.title ? `${patient.title}. ` : ''}${patient.firstName} ${patient.lastName}`} </strong>
  </div>
);

const Base64Image = ({ data, mediaType = "image/jpeg", ...props }) => (
  <img 
    {...props} 
    src={`data:${mediaType};base64,${data}`}
  />
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
    { imageData 
        ? <SizedBase64Image mediaType="image/jpeg" data={imageData} />
        : null
    }
  </PhotoFrame>
);

export const PatientIDCard = ({ patient, imageData }) => (
  <Card>
    <TopBar />
    <MainSection>
      <PhotoContainer>
        <PatientPhoto imageData={imageData} />
        <PhotoLabel patient={patient} />
      </PhotoContainer>
      <Details>
        <MRIDRow id={patient.displayId} />
        <DetailsRow label={'Surname'} value={patient.lastName} />
        <DetailsRow label={'First Name'} value={patient.firstName} />
        <DetailsRow label={'Date of Birth'} value={DateDisplay.rawFormat(patient.dateOfBirth)} />
        <DetailsRow label={'Sex'} value={SEX_VALUE_INDEX[patient.sex].label} />
      </Details>
    </MainSection>
    <BarcodeRow>
      <PatientBarcode patient={patient} width={'43mm'} height={'5.9mm'} />
    </BarcodeRow>
    <BottomBar />
  </Card>
);

export const PatientIDCardPage = ({ patient, imageData }) => {
  React.useEffect(() => {
    printPage({
      landscape: true,
      margins: {
        marginType: 'none',
      },
      pageSize: {
        // it expects dimensions in microns
        height: cardDimensions.width * 1000,
        width: cardDimensions.height * 1000,
      }
    });
  });

  return (
    <PrintPortal>
      <PatientIDCard patient={patient} imageData={imageData} />
    </PrintPortal>
  );
};
