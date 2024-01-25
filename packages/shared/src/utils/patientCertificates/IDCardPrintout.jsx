import React from 'react';
import { Document, Image, Page, StyleSheet, View } from '@react-pdf/renderer';

const convertToPt = mm => mm * 2.835;

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
  }
});

const MainContainer = props => <View style={styles.mainContainer} {...props} />;
const PhotoContainer = props => <View style={styles.photoContainer} {...props} />;
const PhotoFrame = props => <View style={styles.photoFrame} {...props} debug />;

const PatientPhoto = ({ patientImageData }) => {
  return (
    <PhotoContainer>
      <PhotoFrame>
        <Image src={`data:image/jpeg;base64,${patientImageData}`} style={styles.photo}/>
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
  console.log(measures);
  return (
    <Document>
      <Page
        size={{ width: convertToPt(cardDimensions.width), height: convertToPt(cardDimensions.height) }}
        style={{
          paddingHorizontal: measures.cardMaginLeft,
          paddingVertical: measures.cardMarginTop,
        }}
      >
        <MainContainer>
          <PatientPhoto patientImageData={patientImageData} />
        </MainContainer>
      </Page>
    </Document>
  );
};
