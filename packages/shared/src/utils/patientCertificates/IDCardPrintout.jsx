import React from 'react';
import { Document, Image, Page, StyleSheet, View, Text } from '@react-pdf/renderer';
import { getDOB, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';

const convertToPt = mm => {
  // remove 'mm' etc from strings
  if (typeof mm === 'string') return parseFloat(mm.replace(/[^0-9.]/i, '')) * 2.835;

  return mm * 2.835;
};

const styles = StyleSheet.create({
  mainContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '28.6mm',
    overflow: 'hidden',
  },
  photoContainer: {
    width: '1in',
    paddingHorizontal: '2mm',
    paddingTop: '1mm',
  },
  photoFrame: {
    width: '1in',
    height: '1.3in',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: '5mm',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    fontSize: '2.4mm',
    marginVertical: 1.5,
  },
  detailsKey: {
    width: '18mm',
    fontFamily: 'Helvetica-Bold',
  },
  detailsValue: {
    maxWidth: '35mm',
    overflow: 'hidden',
    fontFamily: 'Helvetica-Bold',
  },
  barcodeRow: {
    height: '6.3mm',
    padding: '1mm',
    marginLeft: '1.157in',
  },
});

const MainContainer = props => <View style={styles.mainContainer} {...props} />;
const PhotoContainer = props => <View style={styles.photoContainer} {...props} />;
const PhotoFrame = props => <View style={styles.photoFrame} {...props} />;
const Details = props => <View style={styles.details} {...props} />;
const InfoRow = props => <View style={styles.infoRow} {...props} />;
const DetailsKey = props => <Text style={styles.detailsKey} {...props} />;
const DetailsValue = props => <Text style={styles.detailsValue} {...props} />;
const BarcodeRow = props => <View style={styles.barcodeRow} {...props} />;

const DetailsRow = ({ name, value, getLocalisation }) => {
  const label = getLocalisation(`fields.${name}.shortLabel`);
  return (
    <InfoRow>
      <DetailsKey>{`${label}: `}</DetailsKey>
      <DetailsValue>{value}</DetailsValue>
    </InfoRow>
  );
};

const PatientPhoto = ({ patientImageData }) => {
  return (
    <PhotoContainer>
      <PhotoFrame>
        <Image src={`data:image/jpeg;base64,${patientImageData}`} style={styles.photo} />
      </PhotoFrame>
    </PhotoContainer>
  );
};

export const IDCardPrintout = ({
  patient,
  patientImageData,
  cardDimensions,
  measures,
  getLocalisation,
}) => {
  return (
    <Document>
      <Page
        size={{
          width: convertToPt(cardDimensions.width),
          height: convertToPt(cardDimensions.height),
        }}
        style={{
          paddingHorizontal: measures.cardMaginLeft,
          paddingVertical: measures.cardMarginTop,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MainContainer>
          <PatientPhoto patientImageData={patientImageData} />
          <Details>
            <DetailsRow
              name="displayId"
              value={patient.displayId}
              getLocalisation={getLocalisation}
            />
            <DetailsRow
              name="lastName"
              value={patient.lastName}
              getLocalisation={getLocalisation}
            />
            <DetailsRow
              name="firstName"
              value={patient.firstName}
              getLocalisation={getLocalisation}
            />
            <DetailsRow
              name="dateOfBirth"
              value={getDOB(patient)}
              getLocalisation={getLocalisation}
            />
            <DetailsRow name="sex" value={getSex(patient)} getLocalisation={getLocalisation} />
          </Details>
        </MainContainer>
        <BarcodeRow>
          <PrintableBarcode
            width={convertToPt(43)}
            id={patient.displayId}
            barcodeStyle={{ displayValue: false }}
          />
        </BarcodeRow>
      </Page>
    </Document>
  );
};
