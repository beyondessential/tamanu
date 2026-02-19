import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { capitalize } from 'lodash';

import { INVOICE_INSURER_PAYMENT_STATUSES } from '@tamanu/constants';
import { formatShort } from '@tamanu/utils/dateTime';

import { CertificateHeader, SigningImage, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { InvoiceDetails } from './printComponents/InvoiceDetails';
import {
  getInvoiceItemPriceDisplay,
  getPatientPaymentsWithRemainingBalanceDisplay,
  formatDisplayPrice,
  getInsurerPaymentsWithRemainingBalanceDisplay,
  getInvoiceItemTotalDiscountedPrice,
  hasItemAdjustment,
  getItemAdjustmentAmount,
  getFormattedInvoiceItemCoverageAmount,
  getFormattedInvoiceItemNetCost,
  getFormattedCoverageAmountPerInsurancePlanForInvoice,
  getInvoiceSummary,
} from '../invoice';
import { withLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { PatientDetails } from './printComponents/PatientDetails';
import { InvoiceEncounterDetails } from './printComponents/InvoiceEncounterDetails';

const borderStyle = '1 solid black';

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 50,
  },
});

const textStyles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 3,
    fontSize: 9,
  },
});

const baseTableStyles = StyleSheet.create({
  table: {
    flexDirection: 'column',
    marginBottom: 5,
  },
  heading: {
    paddingLeft: 13,
    paddingTop: 5,
    paddingBottom: 5,
    borderBottom: 'none',
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    borderRight: borderStyle,
    borderLeft: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: 'none',
    alignItems: 'flex-start',
    padding: 7,
  },
  p: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  noteText: {
    fontSize: 7,
    marginTop: 1,
  },
});

const paymentTableStyles = StyleSheet.create({
  headerRow: {
    borderBottom: 'none',
    borderTop: 'none',
  },
  row: {
    borderBottom: 'none',
  },
});

const invoiceItemTableStyles = StyleSheet.create({
  headerRow: {
    borderBottom: 'none',
    borderRight: 'none',
    borderLeft: 'none',
  },
  row: {
    borderBottom: 'none',
    borderRight: 'none',
    borderLeft: 'none',
  },
});

const subRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderRight: 'none',
    borderBottom: 'none',
    marginBottom: -1,
  },
  emptyCell: {
    flexDirection: 'row',
    borderLeft: 'none',
    alignItems: 'flex-start',
    padding: 7,
  },
  labelText: {
    fontSize: 9,
    lineHeight: 1.2,
    color: '#666666',
  },
  valueText: {
    fontSize: 9,
    lineHeight: 1.2,
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

const Table = props => <View style={baseTableStyles.table} {...props} />;
const Row = ({ style, ...props }) => <View style={[baseTableStyles.row, style]} {...props} />;
const P = ({ style = {}, children, bold }) => (
  <Text bold={bold} style={[baseTableStyles.p, style]}>
    {children}
  </Text>
);

const Cell = ({ children, style = {} }) => (
  <View style={[baseTableStyles.baseCell, style]}>
    <P>{children}</P>
  </View>
);

const CustomCellComponent = ({ children, style = {} }) => (
  <View style={[baseTableStyles.baseCell, style]}>{children}</View>
);

const getPrice = item => {
  const price = getInvoiceItemPriceDisplay(item);
  return <P>{price}</P>;
};

const ADJUSTMENT_ROW_HEIGHT = 18;
const ADJUSTMENT_TOP_MARGIN = 5;

/**
 * Cell component for "Ordered by" column that includes adjustment labels when applicable
 */
const OrderedByCellWithAdjustments = ({ children, style, item }) => {
  const showAdjustments = hasItemAdjustment(item);

  return (
    <View
      style={[
        baseTableStyles.baseCell,
        style,
        { flexDirection: 'column', alignItems: 'flex-start' },
      ]}
    >
      <P>{children}</P>
      {showAdjustments && (
        <>
          <View
            style={{
              height: ADJUSTMENT_ROW_HEIGHT,
              marginTop: ADJUSTMENT_TOP_MARGIN,
              justifyContent: 'center',
              alignSelf: 'flex-end',
            }}
          >
            <Text style={subRowStyles.labelText}>Item adjustment</Text>
          </View>
          <View
            style={{
              height: ADJUSTMENT_ROW_HEIGHT,
              justifyContent: 'center',
              alignSelf: 'flex-end',
            }}
          >
            <Text style={subRowStyles.labelText}>Cost after adjustment</Text>
          </View>
        </>
      )}
    </View>
  );
};

/**
 * Cell component for "Cost" column that includes adjustment values when applicable
 */
const PriceCellWithAdjustments = ({ children, style, item }) => {
  const showAdjustments = hasItemAdjustment(item);
  const adjustmentAmount = showAdjustments ? getItemAdjustmentAmount(item) : 0;
  const costAfterAdjustment = showAdjustments ? getInvoiceItemTotalDiscountedPrice(item) || 0 : 0;

  return (
    <View
      style={[
        baseTableStyles.baseCell,
        style,
        { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' },
      ]}
    >
      {children}
      {showAdjustments && (
        <>
          <View
            style={{
              height: ADJUSTMENT_ROW_HEIGHT,
              marginTop: ADJUSTMENT_TOP_MARGIN,
              justifyContent: 'center',
            }}
          >
            <Text style={subRowStyles.valueText}>{formatDisplayPrice(adjustmentAmount)}</Text>
          </View>
          <View style={{ height: ADJUSTMENT_ROW_HEIGHT, justifyContent: 'center' }}>
            <Text style={subRowStyles.valueText}>{formatDisplayPrice(costAfterAdjustment)}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const getInvoiceItemDetails = item => {
  const name = item.product.name;
  const note = item.note;

  return (
    <View>
      <View>
        <P>{name}</P>
      </View>
      {!!note && (
        <View>
          <P style={[baseTableStyles.noteText]}>Note: {note}</P>
        </View>
      )}
    </View>
  );
};

const HeaderCell = ({ children, style }) => (
  <View style={[baseTableStyles.baseCell, style]}>
    <P bold>{children}</P>
  </View>
);

const SectionSpacing = ({ minPresenceAhead = 70 }) => (
  // Between sections, ensure we have enough space for the fixed header
  <View style={{ paddingBottom: '10px' }} minPresenceAhead={minPresenceAhead} />
);

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
      style: { width: '14%' },
      accessor: ({ orderDate }) => (orderDate ? formatShort(orderDate) : '--/--/----'),
    },
    {
      key: 'productName',
      title: 'Details',
      style: { width: '24%' },
      accessor: row => getInvoiceItemDetails(row),
      CellComponent: CustomCellComponent,
    },
    {
      key: 'quantity',
      title: 'Quantity',
      style: { width: '12%' },
      accessor: ({ quantity }) => quantity,
    },
    {
      key: 'approved',
      title: 'Approved',
      style: { width: '13%' },
      accessor: ({ approved }) => (approved ? 'Y' : ''),
    },
    {
      key: 'orderedBy',
      title: 'Ordered by',
      accessor: ({ orderedByUser }) => orderedByUser?.displayName,
      style: { width: '24%' },
      CellComponent: OrderedByCellWithAdjustments,
    },
    {
      key: 'price',
      title: 'Cost',
      accessor: row => getPrice(row),
      style: { width: '10%', justifyContent: 'flex-end' },
      CellComponent: PriceCellWithAdjustments,
    },
    {
      key: 'insurance',
      title: 'Insurance',
      accessor: row => getFormattedInvoiceItemCoverageAmount(row),
      style: { width: '13%', justifyContent: 'flex-end' },
    },
    {
      key: 'netCost',
      title: 'Net cost',
      accessor: row => getFormattedInvoiceItemNetCost(row),
      style: { width: '12%', justifyContent: 'flex-end' },
    },
  ],
  patientPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '14%', paddingLeft: 13 },
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
      accessor: ({ amount }) => amount,
    },
    {
      key: 'receiptNumber',
      title: 'Receipt number',
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '21%' },
    },
    {
      key: 'status',
      title: 'Status',
      accessor: ({ refundPayment }) => refundPayment ? 'Refunded' : 'Paid',
      style: { width: '21%' },
    },
  ],
  insurerPayments: [
    {
      key: 'date',
      title: 'Date',
      style: { width: '15%', paddingLeft: 13 },
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
    <Row style={baseTableStyles.heading}>
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
    </Row>
  );
};

const DataTableHeadingBorder = () => {
  return (
    <View style={{ paddingLeft: 7, paddingRight: 7 }}>
      <HorizontalRule />
    </View>
  );
};

const HeaderRow = ({ columns, style }) => {
  return (
    <Row wrap={false} style={style}>
      {columns.map(({ key, title, style }, colIndex) => (
        <HeaderCell
          key={key}
          style={style}
          isFirst={colIndex === 0}
          isLast={colIndex === columns.length - 1}
        >
          {title}
        </HeaderCell>
      ))}
    </Row>
  );
};

const PaymentDataTableHeading = ({ columns, title }) => {
  return (
    <View fixed>
      {title && <MultipageTableHeading title={title} />}
      <DataTableHeadingBorder />
      <HeaderRow columns={columns} style={paymentTableStyles.headerRow} />
      <DataTableHeadingBorder />
    </View>
  );
};

const InvoiceItemDataTableHeading = ({ columns, title }) => {
  return (
    <View>
      {title && <MultipageTableHeading title={title} />}
      <HeaderRow columns={columns} style={invoiceItemTableStyles.headerRow} />
    </View>
  );
};

const RowWrapper = ({ row, columns, style, SubRowsComponent }) => (
  <React.Fragment>
    <Row wrap={false} style={style}>
      {columns.map(({ key, accessor, style, CellComponent }, colIndex) => {
        const displayValue = accessor ? accessor(row) : row[key] || '';
        const isFirst = colIndex === 0;
        const isLast = colIndex === columns.length - 1;
        if (CellComponent) {
          return (
            <CellComponent key={key} style={style} isFirst={isFirst} isLast={isLast} item={row}>
              {displayValue}
            </CellComponent>
          );
        }
        return (
          <Cell key={key} style={style} isFirst={isFirst} isLast={isLast}>
            {displayValue}
          </Cell>
        );
      })}
    </Row>
    {SubRowsComponent && <SubRowsComponent item={row} columns={columns} />}
  </React.Fragment>
);

const InvoiceItemTable = ({ data, columns, title }) => (
  <Table>
    <InvoiceItemDataTableHeading columns={columns} title={title} />
    {data.map(row => {
      return (
        <RowWrapper key={row.id} row={row} columns={columns} style={invoiceItemTableStyles.row} />
      );
    })}
  </Table>
);

const PaymentTable = ({ data, columns, title }) => (
  <Table>
    <PaymentDataTableHeading columns={columns} title={title} />
    {data.map((row, rowIndex) => {
      const isLastRow = rowIndex === data.length - 1;
      const rowStyle = {
        borderTop: 'none',
        borderBottom: isLastRow ? borderStyle : 'none',
      };
      return <RowWrapper key={row.id} row={row} columns={columns} style={rowStyle} />;
    })}
  </Table>
);

const InvoiceItemTableSection = ({ title, data, columns }) => {
  return (
    <View>
      <View minPresenceAhead={70} />
      <InvoiceItemTable data={data} columns={columns} title={title} />
      <SectionSpacing />
    </View>
  );
};

const PaymentTableSection = ({ title, data, columns }) => {
  return (
    <View>
      <View minPresenceAhead={70} />
      <PaymentTable data={data} columns={columns} title={title} />
      <SectionSpacing />
    </View>
  );
};

const SummaryPane = ({ invoice }) => {
  const {
    invoiceItemsUndiscountedTotal,
    patientPaymentRemainingBalance,
    patientSubtotal,
    patientPaymentsTotal,
    itemAdjustmentsTotal,
  } = getInvoiceSummary(invoice);
  const insurancePlanCoverages = getFormattedCoverageAmountPerInsurancePlanForInvoice(invoice);
  const patientPaymentsTotalDisplay = patientPaymentsTotal > 0 ? patientPaymentsTotal * -1 : 0;

  return (
    <View wrap={false} style={summaryPaneStyles.container}>
      <View style={summaryPaneStyles.item}>
        <P>Invoice total</P>
        <P>{formatDisplayPrice(invoiceItemsUndiscountedTotal)}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>Item adjustments</P>
        <P>{formatDisplayPrice(itemAdjustmentsTotal)}</P>
      </View>
      {insurancePlanCoverages.length > 0 && (
        <>
          <P bold>Insurance coverage</P>
          {insurancePlanCoverages.map(plan => (
            <View key={plan.id} style={summaryPaneStyles.item}>
              <P>{plan.name || plan.code}</P>
              <P>{plan.totalCoverage}</P>
            </View>
          ))}
        </>
      )}
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P bold>Patient subtotal</P>
        <P>{formatDisplayPrice(patientSubtotal)}</P>
      </View>
      <HorizontalRule />
      <View style={summaryPaneStyles.item}>
        <P>Patient payments</P>
        <P>{formatDisplayPrice(patientPaymentsTotalDisplay)}</P>
      </View>
      <HorizontalRule />
      <View style={[summaryPaneStyles.item, { marginVertical: 7.5 }]}>
        <P bold>Patient total due</P>
        <P bold>{formatDisplayPrice(patientPaymentRemainingBalance)}</P>
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
  const { watermark, logo, footerImg } = certificateData;
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
          <InvoiceItemTableSection
            data={invoice?.items}
            columns={COLUMNS.invoiceItems}
            showAdjustmentRows
          />
        )}
        <SummaryPane invoice={invoice} />
        <SectionSpacing />
        {patientPayments?.length && (
          <PaymentTableSection
            title="Patient payment"
            data={patientPayments}
            columns={COLUMNS.patientPayments}
          />
        )}
        {insurerPayments?.length && (
          <PaymentTableSection
            title="Insurer payment"
            data={insurerPayments}
            columns={COLUMNS.insurerPayments}
          />
        )}
        {footerImg && <SigningImage src={footerImg} />}
        <Footer />
      </Page>
    </Document>
  );
};

export const InvoiceRecordPrintout = withLanguageContext(InvoiceRecordPrintoutComponent);
