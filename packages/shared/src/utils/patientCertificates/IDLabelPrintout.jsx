import React from 'react';
import { Page, StyleSheet, View, Document } from '@react-pdf/renderer';
import { DataItem } from './printComponents/DataItem';
import { getDOB, getName, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';

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
  },
});

const Row = props => <View style={styles.row} {...props} />;
const Col = props => <View style={styles.col} {...props} />;

const IDLabel = ({ patient }) => {
  return (
    <View style={styles.idLabel}>
      <Col>
        <Row>
          <Col>
            <DataItem label="Name" value={getName(patient)} />
            <DataItem label="DOB" value={getDOB(patient)} />
          </Col>
          <Col>
            <DataItem label="Sex" value={getSex(patient)} />
            <DataItem label="Patient ID" value={patient.displayId} />
          </Col>
        </Row>
        <PrintableBarcode id={patient.id} />
      </Col>
    </View>
  );
};

export const IDLabelPrintout = ({ patient }) => {
  return (
    <Document>
      <Page>
        <IDLabel patient={patient} />
      </Page>
    </Document>
  );
};
