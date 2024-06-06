import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { PatientDetailsWithAddress } from './printComponents/PatientDetailsWithAddress';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { formatShort } from '../dateTime';
import { EncounterDetails } from './printComponents/EncounterDetails';
import { InvoiceDetails } from './printComponents/InvoiceDetails';
import { getInvoiceLineCode } from '../invoice';

const borderStyle = '1 solid black';

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
  },
});

const textStyles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 11,
    fontWeight: 500,
  },
  tableColumnHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  tableCellContent: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  tableCellFooter: {
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  headerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    fontWeight: 400,
    color: '#888888',
  },
  headerValue: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
    color: '#888888',
  },
});

const tableStyles = StyleSheet.create({
  table: {
    flexDirection: 'column',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  notesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'flex-start',
    padding: 7,
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  notesCell: {
    width: '100%',
    flexDirection: 'column',
    borderLeft: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    alignItems: 'flex-start',
    padding: 7,
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

const priceCellStyles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  crossOutText: {
    textDecoration: 'line-through'
  },
});

const summaryPaneStyles = StyleSheet.create({
  container: {
    width: 220,
    marginLeft: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 3,
    border: borderStyle,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4.5,
    marginBottom: 4.5
  },
  subItem: {
    width: 56,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

const HorizontalRule = ({ width = '1px' }) => {
  return <View style={{ borderBottom: `${width} solid black` }} />;
};

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => <View style={tableStyles.row} {...props} />;
const P = ({ style = {}, children, isBold }) =>
  <Text style={[tableStyles.p, isBold && { fontFamily: 'Helvetica-Bold' }, style]}>
    {children}
  </Text>;

const Cell = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P>{children}</P>
  </View>
);

const PriceCell = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, priceCellStyles.container, style]}>
    {children}
  </View>
);

const getPrice = (row) => {
  const originalPrice = parseFloat(row?.invoiceLineType?.price).toFixed(2);
  const percentageChange = row.percentageChange ? parseFloat(row.percentageChange).toFixed(2) : 0;
  const priceChange = (originalPrice * percentageChange).toFixed(2);
  const finalPrice = (+originalPrice + (+priceChange)).toFixed(2);

  return (
    <>
      <P style={!!percentageChange ? priceCellStyles.crossOutText : undefined}>
        {originalPrice}
      </P>
      {!!percentageChange && <P>{finalPrice}</P>}
    </>
  );
};

const HeaderCell = ({ children, style }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P style={{ fontFamily: 'Helvetica-Bold' }}>{children}</P>
  </View>
);

const SectionSpacing = () => <View style={{ paddingBottom: '10px' }} />;

const COLUMNS = {
  lineItems: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '15%' },
      accessor: ({ dateGenerated }) =>
        dateGenerated ? formatShort(dateGenerated) : '--/--/----',
    },
    {
      key: 'details',
      title: 'Details',
      style: { width: '30%' },
      accessor: ({ invoiceLineType }) => invoiceLineType?.name
    },
    {
      key: 'code',
      title: 'Code',
      style: { width: '12%' },
      accessor: (row) => getInvoiceLineCode(row)
    },
    {
      key: 'orderedBy',
      title: 'Ordered by',
      accessor: ({ orderedBy }) => orderedBy?.displayName,
      style: { width: '27%' },
    },
    {
      key: 'price',
      title: 'Price',
      accessor: (row) => getPrice(row),
      style: { width: '16%' },
      CellComponent: PriceCell
    },
  ],
};

const MultipageTableHeading = ({ title, style = textStyles.sectionTitle }) => {
  let firstPageOccurence = Number.MAX_SAFE_INTEGER;
  return (
    <Text
      fixed
      style={style}
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOccurence && subPageNumber) {
          firstPageOccurence = pageNumber;
        }
        return pageNumber === firstPageOccurence ? title : `${title} cont...`;
      }}
    />
  );
};

const DataTableHeading = ({ columns, title }) => {
  return (
    <View fixed>
      {title && <MultipageTableHeading title={title} />}
      <Row wrap={false}>
        {columns.map(({ key, title, style }) => (
          <HeaderCell key={key} style={style}>
            {title}
          </HeaderCell>
        ))}
      </Row>
    </View>
  );
};

const DataTable = ({ data, columns, title }) => (
  <Table>
    <DataTableHeading columns={columns} title={title} />
    {data.map(row => (
      <Row key={row.id} wrap={false}>
        {columns.map(({ key, accessor, style, CellComponent }) => {
          const displayValue = accessor ? accessor(row) : row[key] || '';
          if (CellComponent) {
            return <CellComponent key={key} style={style}>
              {displayValue}
            </CellComponent>
          }
          return <Cell key={key} style={style}>
            {displayValue}
          </Cell>
        })}
      </Row>
    ))}
  </Table>
);

const TableSection = ({ title, data, columns, type }) => {
  console.log('data', data);
  return (
    <View>
      <View minPresenceAhead={70} />
      <DataTable data={data} columns={columns} title={title} type={type} />
      <SectionSpacing />
    </View>
  );
};

const SummaryPane = ({ discountableTotal, nonDiscountableTotal, priceChangeItem }) => {
  return (
    <View style={summaryPaneStyles.container}>
      <View style={summaryPaneStyles.item}>
        <P>Discountable items subtotal</P>
        <P>{discountableTotal}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>Non-discountable items subtotal</P>
        <P>{nonDiscountableTotal}</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Total</P>
        <P isBold>10.00</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Insurer</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>NIB</P>
        <View style={summaryPaneStyles.subItem}>
          <P>80%</P>
          <P>8.00</P>
        </View>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Patient subtotal</P>
        <P>2.00</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Discount</P>
        <View style={summaryPaneStyles.subItem}>
          <P>{Math.abs(priceChangeItem.percentageChange)*100}%</P>
          <P isBold>10.00</P>
        </View>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>{priceChangeItem.description}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>Applied to discountable balance</P>
        <View style={summaryPaneStyles.subItem}>
          <P>10.00</P>
        </View>
      </View>
      <HorizontalRule />
      <View style={[summaryPaneStyles.item, { marginVertical: 7.5 }]}>
        <P isBold>Patient total</P>
        <P isBold>10.00</P>
      </View>
    </View>
  );
};

export const InvoiceRecordPrintout = ({
  patientData,
  encounter,
  certificateData,
  discharge,
  getLocalisation,
  clinicianText,
  invoice,
  lineItems,
  discountableTotal,
  nonDiscountableTotal,
  priceChangeItem
}) => {
  const { watermark, logo } = certificateData;
  console.log('lineItems', lineItems);
  return (
    <Document>
      <Page size="A4" style={pageStyles.body} wrap>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName="Patient encounter record"
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Patient encounter record"
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetailsWithAddress getLocalisation={getLocalisation} patient={patientData} />
        <SectionSpacing />
        <EncounterDetails
          encounter={encounter}
          discharge={discharge}
          clinicianText={clinicianText}
        />
        <SectionSpacing />
        <InvoiceDetails
          encounter={encounter}
          invoice={invoice}
        />
        <SectionSpacing />
        {lineItems.length > 0 && (
          <TableSection data={lineItems} columns={COLUMNS.lineItems} />
        )}
        <SummaryPane 
          discountableTotal={discountableTotal} 
          nonDiscountableTotal={nonDiscountableTotal} 
          priceChangeItem={priceChangeItem}
        />
        <Footer />
      </Page>
    </Document>
  );
};
