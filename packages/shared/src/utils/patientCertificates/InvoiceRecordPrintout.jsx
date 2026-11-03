import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUS_LABELS,
} from '@tamanu/constants';

import { CertificateHeader, SigningImage, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import { MultiPageHeader } from './printComponents/MultiPageHeader';
import { getName } from '../patientAccessors';
import { Footer } from './printComponents/Footer';
import { withDateTimeContext, useDateTime } from '../pdf/withDateTimeContext';
import { InvoiceDetails } from './printComponents/InvoiceDetails';
import {
  getInvoiceItemPriceDisplay,
  getPatientPaymentsWithRemainingBalanceDisplay,
  formatDisplayPrice,
  getInsurancePlanPaymentsWithRemainingBalanceDisplay,
  getInvoiceItemTotalDiscountedPrice,
  hasItemAdjustment,
  getItemAdjustmentAmount,
  getFormattedInvoiceItemCoverageAmount,
  getFormattedInvoiceItemNetCost,
  getFormattedCoverageAmountPerInsurancePlanForInvoice,
  getInvoiceSummary,
} from '@tamanu/utils/invoice';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { getDrugUnitLabel } from '../medication';
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

// Reads the language context itself so the dispensing unit can be pluralised
// without threading getEnumTranslation through the shared formatters object.
const QuantityCell = ({ quantity, dispensingUnit }) => {
  const { getEnumTranslation } = useLanguageContext();
  if (!dispensingUnit) return quantity != null ? String(quantity) : '';
  return `${quantity} ${getDrugUnitLabel(dispensingUnit, quantity, getEnumTranslation)}`;
};

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
  const { getTranslation } = useLanguageContext();
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
            <Text style={subRowStyles.labelText}>
              {getTranslation('invoice.itemAdjustment.label', 'Item adjustment')}
            </Text>
          </View>
          <View
            style={{
              height: ADJUSTMENT_ROW_HEIGHT,
              justifyContent: 'center',
              alignSelf: 'flex-end',
            }}
          >
            <Text style={subRowStyles.labelText}>
              {getTranslation('invoice.costAfterAdjustment.label', 'Cost after adjustment')}
            </Text>
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

const InvoiceItemDetailsCell = ({ item }) => {
  const { getTranslation } = useLanguageContext();
  const name = item.product.name;
  const note = item.note;

  return (
    <View>
      <View>
        <P>{name}</P>
      </View>
      {!!note && (
        <View>
          <P style={[baseTableStyles.noteText]}>
            {`${getTranslation('invoice.modal.editInvoice.note.label', 'Note')}: ${note}`}
          </P>
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

const getInsurancePlanPaymentStatus = (insurancePlanPayment, getEnumTranslation) => {
  const status = getEnumTranslation(
    INVOICE_INSURANCE_PLAN_PAYMENT_STATUS_LABELS,
    insurancePlanPayment?.status,
  );
  if (insurancePlanPayment?.status === INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED) {
    return (
      <P>{`${status}${insurancePlanPayment?.reason ? ` (${insurancePlanPayment.reason})` : ''}`}</P>
    );
  }
  return status;
};

const getColumns = (getTranslation, getEnumTranslation) => ({
  invoiceItems: [
    {
      key: 'orderDate',
      title: getTranslation('general.date.label', 'Date'),
      style: { width: '14%' },
      accessor: ({ orderDate }, { formatShort }) => formatShort(orderDate),
    },
    {
      key: 'productName',
      title: getTranslation('invoice.modal.editInvoice.details.label', 'Details'),
      style: { width: '24%' },
      accessor: row => <InvoiceItemDetailsCell item={row} />,
      CellComponent: CustomCellComponent,
    },
    {
      key: 'quantity',
      title: getTranslation('invoice.modal.editInvoice.quantity.label', 'Quantity'),
      style: { width: '12%' },
      accessor: ({ quantity, sourcePrescription }) => (
        <QuantityCell quantity={quantity} dispensingUnit={sourcePrescription?.dispensingUnit} />
      ),
    },
    {
      key: 'approved',
      title: getTranslation('invoice.modal.editInvoice.approved.label', 'Approved'),
      style: { width: '13%' },
      accessor: ({ approved }) => (approved ? 'Y' : ''),
    },
    {
      key: 'orderedBy',
      title: getTranslation('invoice.modal.editInvoice.orderedBy.label', 'Ordered by'),
      accessor: ({ orderedByUser }) => orderedByUser?.displayName,
      style: { width: '24%' },
      CellComponent: OrderedByCellWithAdjustments,
    },
    {
      key: 'price',
      title: getTranslation('invoice.modal.editInvoice.cost.label', 'Cost'),
      accessor: row => getPrice(row),
      style: { width: '10%', justifyContent: 'flex-end' },
      CellComponent: PriceCellWithAdjustments,
    },
    {
      key: 'insurance',
      title: getTranslation('invoice.table.column.insurance', 'Insurance'),
      accessor: row => getFormattedInvoiceItemCoverageAmount(row),
      style: { width: '13%', justifyContent: 'flex-end' },
    },
    {
      key: 'netCost',
      title: getTranslation('invoice.modal.editInvoice.netCost.label', 'Net cost'),
      accessor: row => getFormattedInvoiceItemNetCost(row),
      style: { width: '12%', justifyContent: 'flex-end' },
    },
  ],
  patientPayments: [
    {
      key: 'date',
      title: getTranslation('general.date.label', 'Date'),
      style: { width: '14%', paddingLeft: 13 },
      accessor: ({ date }, { formatShort }) => formatShort(date),
    },
    {
      key: 'methodName',
      title: getTranslation('invoice.table.payment.column.method', 'Method'),
      style: { width: '28%' },
      accessor: ({ patientPayment }) => patientPayment?.method?.name,
    },
    {
      key: 'amount',
      title: getTranslation('invoice.table.payment.column.amount', 'Amount'),
      style: { width: '15%' },
      accessor: ({ amount }) => amount,
    },
    {
      key: 'receiptNumber',
      title: getTranslation('invoice.table.payment.column.receiptNumber', 'Receipt number'),
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '21%' },
    },
    {
      key: 'status',
      title: getTranslation('invoice.table.payment.column.status', 'Status'),
      accessor: ({ refundPayment }) =>
        refundPayment
          ? getTranslation('invoice.paymentStatus.refunded', 'Refunded')
          : getTranslation('invoice.paymentStatus.paid', 'Paid'),
      style: { width: '21%' },
    },
  ],
  insurancePlanPayments: [
    {
      key: 'date',
      title: getTranslation('general.date.label', 'Date'),
      style: { width: '15%', paddingLeft: 13 },
      accessor: ({ date }, { formatShort }) => formatShort(date),
    },
    {
      key: 'insurancePlanName',
      title: getTranslation('invoice.table.payment.column.payer', 'Payer'),
      style: { width: '17%' },
      accessor: ({ insurancePlanPayment }) => insurancePlanPayment?.insurancePlan?.name,
    },
    {
      key: 'amount',
      title: getTranslation('invoice.table.payment.column.amount', 'Amount'),
      style: { width: '11%' },
      accessor: ({ amount }) => amount,
    },
    {
      key: 'receiptNumber',
      title: getTranslation('invoice.table.payment.column.receiptNumber', 'Receipt number'),
      accessor: ({ receiptNumber }) => receiptNumber,
      style: { width: '14%' },
    },
    {
      key: 'remainingBalance',
      title: getTranslation('invoice.table.payment.column.remainingBalance', 'Remaining balance'),
      accessor: ({ remainingBalance }) => remainingBalance,
      style: { width: '13%' },
    },
    {
      key: 'status',
      title: getTranslation('invoice.table.payment.column.status', 'Status'),
      accessor: ({ insurancePlanPayment }) =>
        getInsurancePlanPaymentStatus(insurancePlanPayment, getEnumTranslation),
      style: { width: '30%' },
    },
  ],
});

const MultipageTableHeading = ({ title, style = textStyles.sectionTitle }) => {
  const { getTranslation } = useLanguageContext();
  let firstPageOccurrence = Number.MAX_SAFE_INTEGER;
  const continuedTitle = `${title} ${getTranslation('pdf.heading.contentContinued', 'cont...')}`;
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
          return pageNumber === firstPageOccurrence ? title : continuedTitle;
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

const RowWrapper = ({ row, columns, style, formatters, SubRowsComponent }) => (
  <React.Fragment>
    <Row wrap={false} style={style}>
      {columns.map(({ key, accessor, style, CellComponent }, colIndex) => {
        const displayValue = accessor ? accessor(row, formatters) : row[key] || '';
        const isFirst = colIndex === 0;
        const isLast = colIndex === columns.length - 1;
        if (CellComponent) {
          return (
            <CellComponent
              key={key}
              style={style}
              isFirst={isFirst}
              isLast={isLast}
              item={row}
              formatters={formatters}
            >
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

const InvoiceItemTable = ({ data, columns, title, formatters }) => (
  <Table>
    <InvoiceItemDataTableHeading columns={columns} title={title} />
    {data.map(row => {
      return (
        <RowWrapper
          key={row.id}
          row={row}
          columns={columns}
          style={invoiceItemTableStyles.row}
          formatters={formatters}
        />
      );
    })}
  </Table>
);

const PaymentTable = ({ data, columns, title, formatters }) => (
  <Table>
    <PaymentDataTableHeading columns={columns} title={title} />
    {data.map((row, rowIndex) => {
      const isLastRow = rowIndex === data.length - 1;
      const rowStyle = {
        borderTop: 'none',
        borderBottom: isLastRow ? borderStyle : 'none',
      };
      return (
        <RowWrapper
          key={row.id}
          row={row}
          columns={columns}
          style={rowStyle}
          formatters={formatters}
        />
      );
    })}
  </Table>
);

const InvoiceItemTableSection = ({ title, data, columns, formatters }) => {
  return (
    <View>
      <View minPresenceAhead={70} />
      <InvoiceItemTable data={data} columns={columns} title={title} formatters={formatters} />
      <SectionSpacing />
    </View>
  );
};

const PaymentTableSection = ({ title, data, columns, formatters }) => {
  return (
    <View>
      <View minPresenceAhead={70} />
      <PaymentTable data={data} columns={columns} title={title} formatters={formatters} />
      <SectionSpacing />
    </View>
  );
};

const SummaryPane = ({ invoice }) => {
  const { getTranslation } = useLanguageContext();
  const {
    invoiceItemsUndiscountedTotal,
    patientPaymentRemainingBalance,
    patientSubtotal,
    discountTotal,
    patientPaymentsTotal,
    itemAdjustmentsTotal,
  } = getInvoiceSummary(invoice);
  const insurancePlanCoverages = getFormattedCoverageAmountPerInsurancePlanForInvoice(invoice);
  const patientPaymentsTotalDisplay = patientPaymentsTotal > 0 ? patientPaymentsTotal * -1 : 0;
  const hasDiscount = Boolean(invoice.discount?.percentage);
  const discountPercentage = hasDiscount
    ? Math.round(invoice.discount.percentage * 100)
    : 0;

  return (
    <View wrap={false} style={summaryPaneStyles.container}>
      <View style={summaryPaneStyles.item}>
        <P>{getTranslation('invoice.summary.invoiceTotal', 'Invoice total')}</P>
        <P>{formatDisplayPrice(invoiceItemsUndiscountedTotal)}</P>
      </View>
      <View style={summaryPaneStyles.item}>
        <P>{getTranslation('invoice.summary.itemAdjustments', 'Item adjustments')}</P>
        <P>{formatDisplayPrice(itemAdjustmentsTotal)}</P>
      </View>
      {insurancePlanCoverages.length > 0 && (
        <>
          <P bold>{getTranslation('invoice.summary.insuranceTotal', 'Insurance coverage')}</P>
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
        <P bold>{getTranslation('invoice.summary.patientSubtotal', 'Patient subtotal')}</P>
        <P>{formatDisplayPrice(patientSubtotal)}</P>
      </View>
      <HorizontalRule />
      {hasDiscount && (
        <View style={summaryPaneStyles.item}>
          <P>
            {getTranslation(
              'invoice.summary.feeScaleAdjustment',
              'Fee scale adjustment - :percentage%',
              { replacements: { percentage: discountPercentage } },
            )}
          </P>
          <P>{formatDisplayPrice(discountTotal * -1)}</P>
        </View>
      )}
      <View style={summaryPaneStyles.item}>
        <P>{getTranslation('invoice.summary.patientPayments', 'Patient payments')}</P>
        <P>{formatDisplayPrice(patientPaymentsTotalDisplay)}</P>
      </View>
      <HorizontalRule />
      <View style={[summaryPaneStyles.item, { marginVertical: 7.5 }]}>
        <P bold>{getTranslation('invoice.summary.patientTotal', 'Patient total due')}</P>
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
  getSetting,
  clinicianText,
  invoice,
  enablePatientInsurer,
}) => {
  const { formatShort } = useDateTime();
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  const formatters = { formatShort };
  const { watermark, logo, footerImg } = certificateData;
  const patientPayments = getPatientPaymentsWithRemainingBalanceDisplay(invoice);
  const insurancePlanPayments = getInsurancePlanPaymentsWithRemainingBalanceDisplay(invoice);
  const columns = getColumns(getTranslation, getEnumTranslation);
  const documentTitle = getTranslation(
    'pdf.invoiceRecord.title',
    'Invoice number: :invoiceNumber',
    { replacements: { invoiceNumber: invoice.displayId } },
  );

  return (
    <Document>
      <Page size="A4" style={pageStyles.body} wrap>
        {watermark && <Watermark src={watermark} />}
        <MultiPageHeader
          documentName={documentTitle}
          patientId={patientData.displayId}
          patientName={getName(patientData)}
        />
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logo}
            certificateTitle={documentTitle}
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <SectionSpacing />
        <PatientDetails getSetting={getSetting} patient={patientData} />
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
            columns={columns.invoiceItems}
            showAdjustmentRows
            formatters={formatters}
          />
        )}
        <SummaryPane invoice={invoice} />
        <SectionSpacing />
        {patientPayments?.length > 0 && (
          <PaymentTableSection
            title={getTranslation('pdf.invoiceRecord.patientPayment.title', 'Patient payment')}
            data={patientPayments}
            columns={columns.patientPayments}
            formatters={formatters}
          />
        )}
        {insurancePlanPayments?.length > 0 && (
          <PaymentTableSection
            title={getTranslation(
              'pdf.invoiceRecord.insurancePlanPayment.title',
              'Insurance plan payment',
            )}
            data={insurancePlanPayments}
            columns={columns.insurancePlanPayments}
            formatters={formatters}
          />
        )}
        {footerImg && <SigningImage src={footerImg} />}
        <Footer />
      </Page>
    </Document>
  );
};

export const InvoiceRecordPrintout = withLanguageContext(
  withDateTimeContext(InvoiceRecordPrintoutComponent),
);
