import React from 'react';
import { Document, Image, StyleSheet, View } from '@react-pdf/renderer';
import { getDob, getSex } from '../patientAccessors';
import { withLanguageContext } from '../pdf/languageContext';
import { useDateTime, withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

const mmToPt = mm => mm * 2.835;

const styles = StyleSheet.create({
  mainContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
  },
  qrContainer: {
    width: '25mm',
    paddingLeft: '3mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '22mm',
    height: '22mm',
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
});

const MainContainer = props => <View style={styles.mainContainer} {...props} />;
const Details = props => <View style={styles.details} {...props} />;
const InfoRow = props => <View style={styles.infoRow} {...props} />;
const DetailsKey = props => <Text bold style={styles.detailsKey} {...props} />;
const DetailsValue = props => <Text bold style={styles.detailsValue} {...props} />;

const DetailsRow = ({ value, label }) => (
  <InfoRow>
    <DetailsKey>{`${label}: `}</DetailsKey>
    <DetailsValue>{value}</DetailsValue>
  </InfoRow>
);

const QRCodeIDCardPrintoutComponent = ({
  patient,
  qrCodeDataUrl,
  cardDimensions,
  measures,
  getTranslation,
}) => {
  const { formatShort } = useDateTime();
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
            <View style={styles.qrContainer}>
              <Image src={qrCodeDataUrl} style={styles.qrImage} />
            </View>
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
                value={getDob(patient, { getTranslation, formatShort })}
                label={getTranslation('general.localisedField.dateOfBirth.label.short', 'DOB')}
              />
              <DetailsRow
                value={getSex(patient)}
                label={getTranslation('general.localisedField.sex.label', 'Sex')}
              />
            </Details>
          </MainContainer>
        </Card>
      </Page>
    </Document>
  );
};

export const QRCodeIDCardPrintout = withLanguageContext(
  withDateTimeContext(QRCodeIDCardPrintoutComponent),
);
