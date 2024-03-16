import React from 'react';
import { Page, View, Document } from '@react-pdf/renderer';
import { getDOB, getName, getSex } from '../patientAccessors';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { P } from './Typography';
import { CustomStyleSheet } from '../renderPdf';
import { useLanguageContext, withLanguageContext } from '../languageContext';

const fontSize = 11;

const convertToPt = mm => {
  // remove 'mm' etc from strings
  if (typeof mm === 'string') return parseFloat(mm.replace(/[^0-9.]/i, '')) * 2.835;

  return mm * 2.835;
};

const styles = CustomStyleSheet.create({
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
  },
  barcodeContainer: {
    flexDirection: 'column',
  },
  barcodeText: {
    fontFamily: 'Courier-Bold',
    color: '#444444',
  },
  barcode: {
    margin: 0,
    marginBottom: 2,
    textAlign: 'left',
    displayValue: false,
  },
});

const Row = props => <View style={styles().row} {...props} />;
const Col = props => <View style={styles().col} {...props} />;
const BarcodeContainer = props => <View style={styles().barcodeContainer} {...props} />;

const IDLabel = ({ patient }) => {
  return (
    <View style={styles().idLabel}>
      <Row>
        <BarcodeContainer>
          <PrintableBarcode
            barHeight="24px"
            id={patient.displayId}
            fontSize={fontSize}
            barcodeStyle={styles().barcode}
            width="92px"
          />
          <P mb={0} fontSize={fontSize} style={styles().barcodeText}>
            {patient.displayId}
          </P>
        </BarcodeContainer>
        <Col style={{ marginLeft: '3mm' }}>
          <P mb={2} fontSize={fontSize} style={styles().text}>
            {getSex(patient)}
          </P>
          <P mb={0} fontSize={fontSize} style={styles().text}>
            {getDOB(patient)}
          </P>
        </Col>
      </Row>
      <Col style={{ marginTop: -1 }}>
        <P mb={0} mt={0} fontSize={fontSize} style={styles().text}>
          {getName(patient)}
        </P>
      </Col>
    </View>
  );
};

const IDLabelPrintoutComponent = ({ patient, measures }) => {
  const { language } = useLanguageContext();
  const pageStyles = CustomStyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
    },
    grid: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%',
      columnGap: measures.columnGap,
      rowGap: measures.rowGap,
      position: 'absolute',
      left: measures.pageMarginLeft,
      top: convertToPt(measures.pageMarginTop) + convertToPt('3mm'),
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
        style={pageStyles(language).page}
      >
        <View style={pageStyles().grid} wrap={false}>
          {[...Array(30)].map((_, i) => (
            <View style={pageStyles().gridItem} key={`label-${i}`}>
              <IDLabel patient={patient} key={i} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export const IDLabelPrintout = withLanguageContext(IDLabelPrintoutComponent);
