import React from 'react';
import { Page, StyleSheet, View, Document } from '@react-pdf/renderer';
import { getDOB, getName, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { P } from './Typography';

const fontSize = 11;

const convertToPt = mm => {
  // remove 'mm' etc from strings
  if (typeof mm === 'string') return parseFloat(mm.replace(/[^0-9.]/i, '')) * 2.835;

  return mm * 2.835;
};

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
  },
  barcode: {
    margin: 0,
    marginBottom: 2,
    textAlign: 'left',
  },
});

const Row = props => <View style={styles.row} {...props} />;
const Col = props => <View style={styles.col} {...props} />;

const IDLabel = ({ patient }) => {
  return (
    <View style={styles.idLabel}>
      <Row>
        <PrintableBarcode
          barHeight={22}
          id={patient.displayId}
          fontSize={fontSize}
          barcodeStyle={styles.barcode}
        />
        <Col style={{ marginTop: '1mm', marginLeft: '2mm' }}>
          <P mb={2} fontSize={fontSize} style={styles.text}>
            {getSex(patient)}
          </P>
          <P mb={0} fontSize={fontSize} style={styles.text}>
            {getDOB(patient)}
          </P>
        </Col>
      </Row>
      <Col>
        <P mb={0} mt={2} fontSize={fontSize} style={styles.text}>
          {getName(patient)}
        </P>
      </Col>
    </View>
  );
};

export const IDLabelPrintout = ({ patient, measures }) => {
  const pageStyles = StyleSheet.create({
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%',
      columnGap: measures.columnGap,
      rowGap: measures.rowGap,
    },
    gridItem: {
      width: measures.columnWidth,
      height: measures.rowHeight,
    },
  });

  return (
    <Document>
      <Page
        size={{
          width: convertToPt(measures.pageWidth),
          height: convertToPt(measures.pageHeight),
        }}
        style={{
          paddingTop: measures.pageMarginTop,
          paddingLeft: measures.pageMarginLeft,
        }}
      >
        <View style={pageStyles.grid} wrap={false}>
          {[...Array(30)].map((_, i) => (
            <View style={pageStyles.gridItem} key={`label-${i}`}>
              <IDLabel patient={patient} key={i} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
