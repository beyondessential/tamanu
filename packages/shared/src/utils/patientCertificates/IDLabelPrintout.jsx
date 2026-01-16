import React from 'react';
import { StyleSheet, View, Document } from '@react-pdf/renderer';
import { getDob, getName, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { P } from './Typography';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';

const fontSize = 11;

const mmToPt = mm => mm * 2.835;

const styles = StyleSheet.create({
  idLabel: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2mm',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
    flexGrow: 1,
  },
  text: {
    color: '#444444',
    fontFamily: 'Courier',
    lineHeight: 1.2,
  },
  barcodeContainer: {
    flexDirection: 'column',
  },
  barcodeText: {
    fontFamily: 'Courier-Bold',
    color: '#444444',
    lineHeight: 1.2,
  },
  barcode: {
    margin: 0,
    marginBottom: 2,
    textAlign: 'left',
    displayValue: false,
  },
});

const Row = props => <View style={styles.row} {...props} />;
const Col = props => <View style={styles.col} {...props} />;
const BarcodeContainer = props => <View style={styles.barcodeContainer} {...props} />;

const IDLabel = ({ patient, getTranslation }) => {
  return (
    <View style={styles.idLabel}>
      <Row>
        <BarcodeContainer>
          <PrintableBarcode
            barHeight="24px"
            id={patient.displayId}
            fontSize={fontSize}
            barcodeStyle={styles.barcode}
            width="92px"
          />
          <P mb={0} fontSize={fontSize} style={styles.barcodeText}>
            {patient.displayId}
          </P>
        </BarcodeContainer>
        <Col style={{ marginLeft: mmToPt(3) }}>
          <P mb={2} fontSize={fontSize} style={styles.text}>
            {getSex(patient)}
          </P>
          <P mb={0} fontSize={fontSize} style={styles.text}>
            {getDob(patient, { getTranslation })}
          </P>
        </Col>
      </Row>
      <Col style={{ marginTop: -1 }}>
        <P mb={0} mt={0} fontSize={fontSize} style={styles.text}>
          {getName(patient)}
        </P>
      </Col>
    </View>
  );
};

const IDLabelPrintoutComponent = ({ patient, measures }) => {
  const { getTranslation } = useLanguageContext();
  const pageStyles = StyleSheet.create({
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%',
      columnGap: mmToPt(measures.columnGap),
      rowGap: mmToPt(measures.rowGap),
      position: 'absolute',
      left: mmToPt(measures.pageMarginLeft),
      top: mmToPt(measures.pageMarginTop) + mmToPt(3),
    },
    gridItem: {
      width: mmToPt(measures.columnWidth),
      height: mmToPt(measures.rowHeight),
    },
  });

  return (
    <Document>
      <Page
        size={{
          width: mmToPt(measures.pageWidth),
          height: mmToPt(measures.pageHeight),
        }}
      >
        <View style={pageStyles.grid} wrap={false}>
          {[...Array(30)].map((_, i) => (
            <View style={pageStyles.gridItem} key={`label-${i}`}>
              <IDLabel patient={patient} getTranslation={getTranslation} key={i} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export const IDLabelPrintout = withLanguageContext(
  withDateTimeContext(IDLabelPrintoutComponent),
);
