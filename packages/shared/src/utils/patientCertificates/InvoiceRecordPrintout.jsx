import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { capitalize } from 'lodash';
import { INVOICE_INSURER_PAYMENT_STATUSES } from '@tamanu/constants';
import { CertificateHeader, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { formatShort } from '@tamanu/utils/dateTime';
import { InvoiceDetails } from './printComponents/InvoiceDetails';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
  getInvoiceSummaryDisplay,
  getPatientPaymentsWithRemainingBalanceDisplay,
  formatDisplayPrice,
  getInsurerPaymentsWithRemainingBalanceDisplay,
} from '../invoice';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { PatientDetails } from './printComponents/PatientDetails';
import { InvoiceEncounterDetails } from './printComponents/InvoiceEncounterDetails';

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
    marginBottom: 3,
    fontSize: 11,
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
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'flex-start',
    padding: 7,
  },
  p: {
    fontSize: 9,
  },
  noteText: {
    fontSize: 7,
    marginTop: 1,
  },
});

const priceCellStyles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
  },
  crossOutText: {
    textDecoration: 'line-through',
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
    marginBottom: 4.5,
  },
  subItem: {
    width: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const HorizontalRule = ({ width = '1px' }) => {
  return <View style={{ borderBottom: `${width} solid black` }} />;
};

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => <View style={tableStyles.row} {...props} />;
const P = ({ style = {}, children, bold }) => (
  <Text bold={bold} style={[tableStyles.p, style]}>
    {children}
  </Text>
);

const Cell = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P>{children}</P>
  </View>
);

const CustomCellComponent = ({ children, style = {} }) => (
  <View style={[tableStyles.baseCell, style]}>{children}</View>
);

const getPrice = item => {
  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(item);

  return (
    <View style={priceCellStyles.container}>
      <P style={discountPrice ? priceCellStyles.crossOutText : undefined}>{price}</P>
      {!!discountPrice && <P>{discountPrice}</P>}
    </View>
  );
};

const getInvoiceItemDetails = item => {
  const name = item.productName;
  const note = item.note;

  return (
    <View>
      <View>
        <P>{name}</P>
      </View>
      {!!note && (
        <View>
          <P style={[tableStyles.noteText]}>Note: {note}</P>
        </View>
      )}
    </View>
  );
};

const HeaderCell = ({ children, style }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P bold>{children}</P>
  </View>
);

const SectionSpacing = () => <View style={{ paddingBottom: '10px' }} />;

const getInsurerPaymentStatus = insurerPayment => {
  if (insurerPayment?.status === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED) {
    return (
      <P>
        {`${capitalize(insurerPayment?.status)}${
          insurerPayment?.reason ? ` (${insurerPayment?.reason})` : ''
        }`}
      </P>
    );
  }
  return capitalize(insurerPayment?.status);
};

const COLUMNS = {
  invoiceItems: [
    {
      key: 'orderDate',
      title: 'Date',
      style: { width: '12%' },
      accessor: ({ orderDate }) => (orderDate ? formatShort(orderDate) : '--/--/----'),
    },
    {
      key: 'productName',
      title: 'Details',
      style: { width: '34%' },
      accessor: row => getInvoiceItemDetails(row),
      CellComponent: CustomCellComponent,
    },
    {
      key: 'productCode',
      title: 'Code',
      style: { width: '10%' },
      accessor: ({ productCode }) => productCode,
    },
    {
      key: 'quantity',
      title: 'Quantity',
      style: { width: '11%' },
      accessor: ({ quantity }) => quantity,
    },
    {
      key: 'orderedBy',
      title: 'Ordered by',
      accessor: ({ orderedByUser }) => orderedByUser?.displayName,
      style: { width: '14%' },
    },
    {
      key: 'price',
      title: 'Price',
      accessor: row => getPrice(row),
      style: { width: '19%' },
      CellComponent: CustomCellComponent,
    },
  ],
  patientPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '15%' },
      accessor: ({ date }) => (date ? formatShort(date) : '--/--/----'),
    },
    {
      key: 'methodName',
      title: 'Method',
      style: { width: '28%' },
      accessor: ({ patientPayment }) => patientPayment?.method?.name,
    },
    {
      key: 'amount',
      title: 'Amount',
      style: { width: '15%' },
      accessor: ({ amount }) => formatDisplayPrice(amount),
    },
    {
      key: 'receiptNumber',
      title: 'Receipt number',
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '21%' },
    },
    {
      key: 'remainingBalance',
      title: 'Remaining balance',
      accessor: ({ remainingBalance }) => remainingBalance,
      style: { width: '21%' },
    },
  ],
  insurerPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '15%' },
      accessor: ({ date }) => (date ? formatShort(date) : '--/--/----'),
    },
    {
      key: 'insurerName',
      title: 'Payer',
      style: { width: '17%' },
      accessor: ({ insurerPayment }) => insurerPayment?.insurer?.name,
    },
    {
      key: 'amount',
      title: 'Amount',
      style: { width: '11%' },
      accessor: ({ amount }) => amount,
    },
    {
      key: 'receiptNumber',
      title: 'Receipt number',
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '14%' },
    },
    {
      key: 'remainingBalance',
      title: 'Remaining balance',
      accessor: ({ remainingBalance }) => remainingBalance,
      style: { width: '13%' },
    },
    {
      key: 'status',
      title: 'Status',
      accessor: ({ insurerPayment }) => getInsurerPaymentStatus(insurerPayment),
      style: { width: '30%' },
    },
  ],
};

const MultipageTableHeading = ({ title, style = textStyles.sectionTitle }) => {
  let firstPageOccurrence = Number.MAX_SAFE_INTEGER;
  return (
    <Text
      bold
      fixed
      style={style}
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOccurrence && subPageNumber) {
          firstPageOccurrence = pageNumber;
        }
        return pageNumber === firstPageOccurrence ? title : `${title} cont...`;
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
            return (
              <CellComponent key={key} style={style}>
                {displayValue}
              </CellComponent>
            );
          }
          return (
            <Cell key={key} style={style}>
              {displayValue}
            </Cell>
          );
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

const SummaryPane = ({ invoice }) => {
  const { itemsSubtotal, patientSubtotal, discountTotal, patientTotal } =
    getInvoiceSummaryDisplay(invoice);

  return (
    <View wrap={false} style={summaryPaneStyles.container}>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P bold>Total</P>
        <P bold>{itemsSubtotal ?? '-'}</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P bold>Patient subtotal</P>
        <P>{patientSubtotal}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P bold>Discount</P>
        {!!invoice.discount && (
          <View style={summaryPaneStyles.subItem}>
            <P>{invoice.discount?.percentage * 100}%</P>
            <P bold>{typeof discountTotal === 'string' ? `-${discountTotal}` : '-'}</P>
          </View>
        )}
      </View>
      {!!invoice.discount && (
        <View style={summaryPaneStyles.item}>
          {invoice.discount?.isManual ? <P>Manual discount</P> : <P>Patient discount applied</P>}
        </View>
      )}
      <HorizontalRule />
      <View style={[summaryPaneStyles.item, { marginVertical: 7.5 }]}>
        <P bold>Patient total</P>
        <P bold>{patientTotal ?? '-'}</P>
      </View>
    </View>
  );
};

const InvoiceRecordPrintoutComponent = ({
  patientData,
  encounter,
  certificateData,
  discharge,
  getLocalisation,
  getSetting,
  clinicianText,
  invoice,
  enablePatientInsurer,
}) => {
  const { watermark, logo } = certificateData;
  const patientPayments = getPatientPaymentsWithRemainingBalanceDisplay(invoice);
  const insurerPayments = getInsurerPaymentsWithRemainingBalanceDisplay(invoice);

  return (
    <Document>
      <Page size="A4" style={pageStyles.body} wrap>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName={`Invoice number: ${invoice.displayId}`}
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logo}
            certificateTitle={`Invoice number: ${invoice.displayId}`}
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetails
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          patient={patientData}
        />
        <SectionSpacing />
        <InvoiceEncounterDetails
          encounter={encounter}
          discharge={discharge}
          clinicianText={clinicianText}
        />
        <SectionSpacing />
        <InvoiceDetails
          encounter={encounter}
          invoice={invoice}
          patient={patientData}
          enablePatientInsurer={enablePatientInsurer}
        />
        <SectionSpacing />
        {invoice?.items?.length > 0 && (
          <TableSection data={invoice?.items} columns={COLUMNS.invoiceItems} />
        )}
        <SummaryPane invoice={invoice} />
        <SectionSpacing />
        {patientPayments?.length && (
          <TableSection
            title="Patient payment"
            data={patientPayments}
            columns={COLUMNS.patientPayments}
          />
        )}
        {insurerPayments?.length && (
          <TableSection
            title="Insurer payment"
            data={insurerPayments}
            columns={COLUMNS.insurerPayments}
          />
        )}
        <Footer />
      </Page>
    </Document>
  );
};

export const InvoiceRecordPrintout = withLanguageContext(InvoiceRecordPrintoutComponent);
