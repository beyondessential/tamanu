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
  const originalPrice = row?.productPrice ? parseFloat(row.productPrice).toFixed(2) : 0;
  const discountPercentage = row?.discount?.percentage ? parseFloat(row.discount.percentage).toFixed(2) : 0;
  const priceChange = (originalPrice * discountPercentage).toFixed(2);
  const finalPrice = (+originalPrice - (+priceChange)).toFixed(2);

  return (
    <>
      <P style={discountPercentage ? priceCellStyles.crossOutText : undefined}>
        {originalPrice}
      </P>
      {!!discountPercentage && <P>{finalPrice}</P>}
    </>
  );
};

const HeaderCell = ({ children, style }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P style={{ fontFamily: 'Helvetica-Bold' }}>{children}</P>
  </View>
);

const SectionSpacing = () => <View style={{ paddingBottom: '10px' }} />;

//TODO: re-map row data based on data returned from Back-end
const COLUMNS = {
  lineItems: [
    {
      key: 'orderDate',
      title: 'Date',
      style: { width: '15%' },
      accessor: ({ orderDate }) =>
        orderDate ? formatShort(orderDate) : '--/--/----',
    },
    {
      key: 'productName',
      title: 'Details',
      style: { width: '30%' },
      accessor: ({ productName }) => productName
    },
    {
      key: 'code',
      title: 'Code',
      style: { width: '12%' },
      accessor: ({ productCode }) => productCode
    },
    {
      key: 'orderedBy',
      title: 'Ordered by',
      accessor: ({ orderedByUserName }) => orderedByUserName,
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
  patientPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '15%' },
      accessor: ({ date }) => date
    },
    {
      key: 'method',
      title: 'Method',
      style: { width: '29%' },
      accessor: ({ method }) => method
    },
    {
      key: 'amount',
      title: 'Amount',
      style: { width: '12%' },
      accessor: ({ amount }) => amount
    },
    {
      key: 'receiptNumber',
      title: 'Receipt number',
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '22%' },
    },
    {
      key: 'remainingBalance',
      title: 'Remaining balance',
      accessor: ({ remainingBalance }) => remainingBalance,
      style: { width: '22%' },
    },
  ],
  insurerPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '16%' },
      accessor: ({ date }) => date
    },
    {
      key: 'payer',
      title: 'Payer',
      style: { width: '18%' },
      accessor: ({ payer }) => payer
    },
    {
      key: 'amount',
      title: 'Amount',
      style: { width: '10%' },
      accessor: ({ amount }) => amount
    },
    {
      key: 'receiptNumber',
      title: 'Receipt number',
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '13%' },
    },
    {
      key: 'remainingBalance',
      title: 'Remaining balance',
      accessor: ({ remainingBalance }) => remainingBalance,
      style: { width: '14%' },
    },
    {
      key: 'status',
      title: 'Status',
      accessor: ({ status }) => status,
      style: { width: '29%' },
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
  return (
    <View>
      <View minPresenceAhead={70} />
      <DataTable data={data} columns={columns} title={title} type={type} />
      <SectionSpacing />
    </View>
  );
};

const SummaryPane = ({ discountableTotal, invoice }) => {
  const discountPercentage = invoice?.discount?.percentage || 0;
  const discountedPrice = discountPercentage ? discountableTotal * discountPercentage : 0;
  const patientTotal = discountableTotal - discountedPrice;

  return (
    <View wrap={false} style={summaryPaneStyles.container}>
      <View style={summaryPaneStyles.item}>
        <P>Discountable items subtotal</P>
        <P>{discountableTotal || '-'}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>Non-discountable items subtotal</P>
        <P>-</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Total</P>
        <P isBold>{discountableTotal || '-'}</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P isBold>Insurer</P>
      </View>
      {/* TODO: get invoice insurer data from back-end */}
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
          <P>{discountPercentage * 100}%</P>
          <P isBold>{discountedPrice.toFixed(2)}</P>
        </View>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>{invoice?.discount?.reason}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>Applied to discountable balance</P>
        <View style={summaryPaneStyles.subItem}>
          <P>{discountableTotal}</P>
        </View>
      </View>
      <HorizontalRule />
      <View style={[summaryPaneStyles.item, { marginVertical: 7.5 }]}>
        <P isBold>Patient total</P>
        <P isBold>{patientTotal ? patientTotal.toFixed(2) : '-'}</P>
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
  discountableTotal,
  patientPayments,
  insurerPayments,
}) => {
  const { watermark, logo } = certificateData;
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
        {invoice?.items?.length > 0 && (
          <TableSection data={invoice?.items} columns={COLUMNS.lineItems} />
        )}
        <SummaryPane 
          discountableTotal={discountableTotal}
          invoice={invoice}
        />
        <SectionSpacing />
        {patientPayments?.length && (
          <TableSection data={patientPayments} columns={COLUMNS.patientPayments} />
        )}
        {insurerPayments?.length && (
          <TableSection data={insurerPayments} columns={COLUMNS.insurerPayments} />
        )}
        <Footer />
      </Page>
    </Document>
  );
};
