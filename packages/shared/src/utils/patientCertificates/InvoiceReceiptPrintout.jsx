import React from 'react';
import { Document, Image, StyleSheet, View } from '@react-pdf/renderer';

import { getInvoiceItemPriceDisplay, getInvoicePrintTotalsDisplay } from '@tamanu/utils/invoice';

import { getDob, getName } from '../patientAccessors';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { useDateTime, withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { InvoiceItemQuantity } from './printComponents/InvoiceItemQuantity';

// spec: INVPRT#receipt-layout

const POINTS_PER_MM = 72 / 25.4;
const RECEIPT_WIDTH = 80 * POINTS_PER_MM;
// An 80mm thermal printer prints only the middle 72mm of the roll
const UNPRINTABLE_EDGE = 4 * POINTS_PER_MM;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: UNPRINTABLE_EDGE,
    paddingVertical: 8,
    fontSize: 8,
    lineHeight: 1.3,
  },
  section: {
    paddingVertical: 6,
  },
  divider: {
    borderBottom: '1 dotted black',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    height: 40,
    maxWidth: '100%',
    marginBottom: 4,
    objectFit: 'contain',
  },
  centredText: {
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    flexShrink: 1,
    paddingRight: 8,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  itemName: {
    flex: 1,
  },
  itemQuantity: {
    width: 52,
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  // react-pdf ignores textAlign on text widened by minWidth, so the column right-aligns its text
  itemTotal: {
    flexShrink: 0,
    minWidth: 48,
    alignItems: 'flex-end',
  },
  // A little larger than the section titles, which are set at the page's font size
  patientTotalDue: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
});

const Divider = () => <View style={styles.divider} />;

const Section = ({ title, children }) => (
  <View style={styles.section}>
    {title && (
      <Text bold style={styles.sectionTitle}>
        {title}
      </Text>
    )}
    {children}
  </View>
);

const LabelledValue = ({ label, value, isLabelBold = false, isValueBold = false }) => (
  <View style={styles.row}>
    <Text bold={isLabelBold} style={styles.label}>
      {label}
    </Text>
    <Text bold={isValueBold} style={styles.value}>
      {value}
    </Text>
  </View>
);

const HeaderSection = ({ certificateData }) => {
  const { logo, title, subTitle } = certificateData;
  return (
    <Section>
      <View style={styles.header}>
        {logo && <Image src={logo} style={styles.logo} cache={false} />}
        <Text bold style={styles.centredText}>
          {title}
        </Text>
        <Text style={styles.centredText}>{subTitle}</Text>
      </View>
    </Section>
  );
};

const PatientDetailsSection = ({ patient }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();
  return (
    <Section title={getTranslation('pdf.patientDetails.title', 'Patient details')}>
      <LabelledValue
        isLabelBold
        label={getTranslation('general.name.label', 'Name')}
        value={getName(patient)}
      />
      {/* Like the A4 patient details, prefer the deployment's short name for a field */}
      <LabelledValue
        isLabelBold
        label={
          getTranslation('general.localisedField.dateOfBirth.label.short') ||
          getTranslation('general.localisedField.dateOfBirth.label') ||
          'Date of birth'
        }
        value={getDob(patient, { getTranslation, formatShort })}
      />
      <LabelledValue
        isLabelBold
        label={
          getTranslation('general.localisedField.displayId.label.short') ||
          getTranslation('general.localisedField.displayId.label') ||
          'Patient ID'
        }
        value={patient.displayId}
      />
    </Section>
  );
};

const InvoiceSection = ({ invoice }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();
  return (
    <Section>
      <LabelledValue
        isLabelBold
        label={getTranslation('invoice.invoiceNumber', 'Invoice number')}
        value={invoice.displayId}
      />
      <LabelledValue
        isLabelBold
        label={getTranslation('general.date.label', 'Date')}
        value={formatShort(invoice.date)}
      />
    </Section>
  );
};

const LineItemRows = ({ items }) =>
  items.map(item => (
    <View key={item.id} style={styles.row}>
      <Text style={styles.itemName}>{item.product?.name}</Text>
      <Text style={styles.itemQuantity}>
        <InvoiceItemQuantity
          quantity={item.quantity}
          dispensingUnit={item.sourcePrescription?.dispensingUnit}
        />
      </Text>
      <View style={styles.itemTotal}>
        <Text>{getInvoiceItemPriceDisplay(item)}</Text>
      </View>
    </View>
  ));

const TotalRows = ({ totals }) => {
  const { getTranslation } = useLanguageContext();
  const { feeScaleAdjustment } = totals;
  return (
    <>
      <LabelledValue
        isLabelBold
        label={getTranslation('invoice.summary.invoiceTotal', 'Invoice total')}
        value={totals.invoiceTotal}
      />
      <LabelledValue
        label={getTranslation('invoice.summary.itemAdjustments', 'Item adjustments')}
        value={totals.itemAdjustments}
      />
      <LabelledValue
        label={getTranslation('invoice.summary.insuranceTotal', 'Insurance coverage')}
        value={totals.insuranceCoverage}
      />
      <LabelledValue
        label={getTranslation('invoice.summary.patientSubtotal', 'Patient subtotal')}
        value={totals.patientSubtotal}
      />
      {feeScaleAdjustment && (
        <LabelledValue
          label={getTranslation(
            'invoice.summary.feeScaleAdjustment',
            'Fee scale adjustment - :percentage%',
            { replacements: { percentage: feeScaleAdjustment.percentage } },
          )}
          value={feeScaleAdjustment.amount}
        />
      )}
      <LabelledValue
        label={getTranslation('invoice.summary.patientPayments', 'Patient payments')}
        value={totals.patientPayments}
      />
    </>
  );
};

const DetailsSection = ({ items, totals }) => {
  const { getTranslation } = useLanguageContext();
  const title = getTranslation('pdf.invoiceReceipt.details.title', 'Details');

  if (items.length === 0) {
    return (
      <Section title={title}>
        <TotalRows totals={totals} />
      </Section>
    );
  }

  // The divider separates the line items from the totals beneath them
  return (
    <>
      <Section title={title}>
        <LineItemRows items={items} />
      </Section>
      <Divider />
      <Section>
        <TotalRows totals={totals} />
      </Section>
    </>
  );
};

const PatientTotalDueSection = ({ totals }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <Section>
      <View style={styles.patientTotalDue}>
        <LabelledValue
          isLabelBold
          isValueBold
          label={getTranslation('invoice.summary.patientTotal', 'Patient total due')}
          value={totals.patientTotalDue}
        />
      </View>
    </Section>
  );
};

const InvoiceReceiptPrintoutComponent = ({ patientData, certificateData, invoice }) => {
  const items = invoice.items ?? [];
  const totals = getInvoicePrintTotalsDisplay(invoice);

  return (
    <Document>
      {/* With no height, the page is as long as its content: one continuous strip of roll */}
      <Page size={{ width: RECEIPT_WIDTH }} wrap={false} style={styles.page}>
        <HeaderSection certificateData={certificateData} />
        <Divider />
        <PatientDetailsSection patient={patientData} />
        <Divider />
        <InvoiceSection invoice={invoice} />
        <Divider />
        <DetailsSection items={items} totals={totals} />
        <Divider />
        <PatientTotalDueSection totals={totals} />
        <Divider />
      </Page>
    </Document>
  );
};

export const InvoiceReceiptPrintout = withLanguageContext(
  withDateTimeContext(InvoiceReceiptPrintoutComponent),
);
