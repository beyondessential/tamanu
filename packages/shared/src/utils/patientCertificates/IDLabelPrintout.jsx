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
    padding: '2mm',
  },
  col: {
    flexDirection: 'column',
    padding: '2mm',
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
            <DataItem label="Name" value={getName(patient)} fontSize={10} />
            <DataItem label="DOB" value={getDOB(patient)} fontSize={10} />
          </Col>
          <Col>
            <DataItem label="Sex" value={getSex(patient)} fontSize={10} />
            <DataItem label="Patient ID" value={patient.displayId} fontSize={10} />
          </Col>
        </Row>
        <PrintableBarcode width={136} barHeight={51} id={patient.displayId} />
      </Col>
    </View>
  );
};

`display: grid;
  padding-top: ${p => p.pageMarginTop};
  padding-left: ${p => p.pageMarginLeft};how c
  grid-template-columns: repeat(${p => p.columnTotal}, ${p => p.columnWidth});
  grid-template-rows: repeat(${p => p.rowTotal}, ${p => p.rowHeight});
  grid-column-gap: ${p => p.columnGap};
  grid-row-gap: ${p => p.rowGap};`;

export const IDLabelPrintout = ({ patient, measures }) => {
  console.log(measures);

  const pageStyles = StyleSheet.create({
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%'
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
        <View style={pageStyles.grid} debug>
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
