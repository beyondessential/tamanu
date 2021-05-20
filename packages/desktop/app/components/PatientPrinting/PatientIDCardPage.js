import React from 'react';
import styled from 'styled-components';


import { SEX_VALUE_INDEX, Colors } from '../../constants';
import { DateDisplay } from '../DateDisplay';
import { PatientBarcode } from './PatientBarcode';

import { printPage, PrintPortal } from '../../print';
import { TamanuLogo } from '../TamanuLogo';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.2rem;
  width: 85.6mm;
  height: 53.92mm;
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


const DetailsRow = ({ label, value }) => (
  <div style={{ lineHeight: '4mm', fontSize: '2.4mm', display: 'flex', flexDirection: 'row' }}>
    <strong style={{ width: '23mm' }}>{`${label}: `}</strong> {value}
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

// TODO: use actual patient photo 
const PatientPhoto = ({ patient }) => (
  <div width={'1in'} height={'1.3in'} background={'red'}>
    <TamanuLogo size={'20mm'} />
  </div>
);

export const PatientIDCard = ({ patient }) => console.log("auu") ?? (
  <Card>
    <TopBar />
    <MainSection>
      <PhotoContainer>
        <PatientPhoto patient={patient} />
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

// A4 is 8.3in x 11.7in (https://a-size.com/a4-paper-size/). Not sure if this is different?
const LetterPage = styled.div`
  background: white;
  width: 8.5in;
  height: 11in;
`;

const PatientIDPage = styled.div`
  margin-left: 0.2198in;
  margin-top: 0.5in;
`;

export const PatientIDCardPage = ({ patient }) => {
  React.useEffect(() => {
    printPage();
  });

  return (
    <PrintPortal>
      <LetterPage>
        <PatientIDPage>
          <PatientIDCard patient={patient} />
        </PatientIDPage>
      </LetterPage>
    </PrintPortal>
  );
};
