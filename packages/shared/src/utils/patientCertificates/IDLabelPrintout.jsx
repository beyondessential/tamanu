import React from 'react';
import { Page, StyleSheet, View, Document } from '@react-pdf/renderer';
import { getDOB, getName, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { P } from './Typography';

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
          fontSize={10}
          barcodeStyle={{ margin: 0, marginBottom: 2, textAlign: 'left' }}
        />
        <Col style={{ marginTop: '1mm', marginLeft: '2mm' }}>
          <P mb={2} fontSize={10} style={styles.text}>
            {getSex(patient)}
          </P>
          <P mb={0} fontSize={10} style={styles.text}>
            {getDOB(patient)}
          </P>
        </Col>
      </Row>
      <Col>
        <P mb={0} mt={2} fontSize={10} style={styles.text}>
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
    },
    gridItem: {
      width: `${100 / measures.columnTotal}%`,
      height: measures.rowHeight,
    },
  });

  return (
    <Document>
      <Page
        size={'A4'}
        style={{
          paddingVertical: measures.pageMarginTop,
          paddingHorizontal: measures.pageMarginLeft,
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
