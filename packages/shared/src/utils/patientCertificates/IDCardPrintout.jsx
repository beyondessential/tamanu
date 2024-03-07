import React from 'react';
import { Document, Image, Page, View, Text } from '@react-pdf/renderer';
import { getDOB, getSex } from '../patientAccessors';
import JsBarcode from 'jsbarcode';
import { CustomStyleSheet } from '../renderPdf';

const CustomBarcode = ({ id, width, height }) => {
  // eslint-disable-next-line no-undef
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, id, {
    width: 1,
    margin: 0,
    displayValue: false,
  });
  const barcode = canvas.toDataURL();
  return <Image source={barcode} style={{ height, maxWidth: width, objectFit: 'cover' }} />;
};

const convertToPt = mm => {
  // remove 'mm' etc from strings
  if (typeof mm === 'string') return parseFloat(mm.replace(/[^0-9.]/i, '')) * 2.835;

  return mm * 2.835;
};

const styles = CustomStyleSheet.create({
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
    marginVertical: 1.8,
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
    marginLeft: '29.4mm',
  },
});

const MainContainer = props => <View style={styles().mainContainer} {...props} />;
const PhotoContainer = props => <View style={styles().photoContainer} {...props} />;
const PhotoFrame = props => <View style={styles().photoFrame} {...props} />;
const Details = props => <View style={styles().details} {...props} />;
const InfoRow = props => <View style={styles().infoRow} {...props} />;
const DetailsKey = props => <Text style={styles().detailsKey} {...props} />;
const DetailsValue = props => <Text style={styles().detailsValue} {...props} />;
const BarcodeRow = props => <View style={styles().barcodeRow} {...props} />;

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
        <Image src={`data:image/jpeg;base64,${patientImageData}`} style={styles().photo} />
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
  const pageStyles = CustomStyleSheet.create({
    card: {
      width: cardDimensions.width,
      height: cardDimensions.height,
      marginTop: convertToPt(measures.cardMarginTop),
      marginLeft: convertToPt(measures.cardMarginLeft),
      display: 'flex',
      flexDirection: 'column',
    },
  });

  const Card = props => <View style={pageStyles().card} {...props} />;

  return (
    <Document>
      <Page size="A4" style={{ paddingTop: convertToPt('10.6mm') }}>
        <Card>
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
            <CustomBarcode height="5.9mm" width="33mm" id={patient.displayId} />
          </BarcodeRow>
        </Card>
      </Page>
    </Document>
  );
};
