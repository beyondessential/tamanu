import React from 'react';
import { Document, Image, StyleSheet, View } from '@react-pdf/renderer';
import { getDob, getSex } from '../patientAccessors';
import JsBarcode from 'jsbarcode';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

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

const mmToPt = mm => mm * 2.835;

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
    marginVertical: 1.8,
  },
  detailsKey: {
    width: '18mm',
    fontWeight: 700,
  },
  detailsValue: {
    maxWidth: '35mm',
    overflow: 'hidden',
    fontWeight: 700,
  },
  barcodeRow: {
    height: '6.3mm',
    marginLeft: '29.4mm',
  },
});

const MainContainer = props => <View style={styles.mainContainer} {...props} />;
const PhotoContainer = props => <View style={styles.photoContainer} {...props} />;
const PhotoFrame = props => <View style={styles.photoFrame} {...props} />;
const Details = props => <View style={styles.details} {...props} />;
const InfoRow = props => <View style={styles.infoRow} {...props} />;
const DetailsKey = props => <Text bold style={styles.detailsKey} {...props} />;
const DetailsValue = props => <Text bold style={styles.detailsValue} {...props} />;
const BarcodeRow = props => <View style={styles.barcodeRow} {...props} />;

const DetailsRow = ({ value, label }) => (
  <InfoRow>
    <DetailsKey>{`${label}: `}</DetailsKey>
    <DetailsValue>{value}</DetailsValue>
  </InfoRow>
);

const PatientPhoto = ({ patientImageData }) => {
  return (
    <PhotoContainer>
      <PhotoFrame>
        <Image src={`data:image/jpeg;base64,${patientImageData}`} style={styles.photo} />
      </PhotoFrame>
    </PhotoContainer>
  );
};

const IDCardPrintoutComponent = ({
  patient,
  patientImageData,
  cardDimensions,
  measures,
  getTranslation,
}) => {
  const pageStyles = StyleSheet.create({
    card: {
      width: cardDimensions.width,
      height: cardDimensions.height,
      marginTop: mmToPt(measures.cardMarginTop),
      marginLeft: mmToPt(measures.cardMarginLeft),
      display: 'flex',
      flexDirection: 'column',
    },
  });

  const Card = props => <View style={pageStyles.card} {...props} />;

  return (
    <Document>
      <Page size="A4" style={{ paddingTop: mmToPt(10.6) }}>
        <Card>
          <MainContainer>
            <PatientPhoto patientImageData={patientImageData} />
            <Details>
              <DetailsRow
                value={patient.displayId}
                label={getTranslation('general.localisedField.displayId.label.short', 'NHN')}
              />
              <DetailsRow
                value={patient.lastName}
                label={getTranslation('general.localisedField.lastName.label', 'Last name')}
              />
              <DetailsRow
                value={patient.firstName}
                label={getTranslation('general.localisedField.firstName.label', 'First name')}
              />
              <DetailsRow
                value={getDob(patient, { getTranslation })}
                label={getTranslation('general.localisedField.dateOfBirth.label.short', 'DOB')}
              />
              <DetailsRow
                value={getSex(patient)}
                label={getTranslation('general.localisedField.sex.label', 'Sex')}
              />
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

export const IDCardPrintout = withLanguageContext(IDCardPrintoutComponent);
