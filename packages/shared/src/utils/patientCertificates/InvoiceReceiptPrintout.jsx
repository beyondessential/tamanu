import React from 'react';
import { Document, Image, StyleSheet, View } from '@react-pdf/renderer';

import { getInvoiceItemPriceDisplay, getInvoiceReceiptTotalsDisplay } from '@tamanu/utils/invoice';

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
  itemTotal: {
    flexShrink: 0,
    minWidth: 48,
    textAlign: 'right',
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

const LabelledValue = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
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
        label={getTranslation('general.name.label', 'Name')}
        value={getName(patient)}
      />
      {/* Like the A4 patient details, prefer the deployment's short name for a field */}
      <LabelledValue
        label={
          getTranslation('general.localisedField.dateOfBirth.label.short') ||
          getTranslation('general.localisedField.dateOfBirth.label') ||
          'Date of birth'
        }
        value={getDob(patient, { getTranslation, formatShort })}
      />
      <LabelledValue
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
        label={getTranslation('invoice.invoiceNumber', 'Invoice number')}
        value={invoice.displayId}
      />
      <LabelledValue
        label={getTranslation('general.date.label', 'Date')}
        value={formatShort(invoice.date)}
      />
    </Section>
  );
};

const LineItemsSection = ({ items }) => (
  <Section>
    {items.map(item => (
      <View key={item.id} style={styles.row}>
        <Text style={styles.itemName}>{item.product?.name}</Text>
        <Text style={styles.itemQuantity}>
          <InvoiceItemQuantity
            quantity={item.quantity}
            dispensingUnit={item.sourcePrescription?.dispensingUnit}
          />
        </Text>
        <Text style={styles.itemTotal}>{getInvoiceItemPriceDisplay(item)}</Text>
      </View>
    ))}
  </Section>
);

const DetailsSection = ({ totals }) => {
  const { getTranslation } = useLanguageContext();
  const { feeScaleAdjustment } = totals;
  return (
    <Section title={getTranslation('pdf.invoiceReceipt.details.title', 'Details')}>
      <LabelledValue
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
    </Section>
  );
};

const PatientTotalDueSection = ({ totals }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <Section>
      <LabelledValue
        label={getTranslation('invoice.summary.patientTotal', 'Patient total due')}
        value={totals.patientTotalDue}
      />
    </Section>
  );
};

const InvoiceReceiptPrintoutComponent = ({ patientData, certificateData, invoice, getSetting }) => {
  const items = invoice.items ?? [];
  const totals = getInvoiceReceiptTotalsDisplay(invoice, {
    isSlidingFeeScaleEnabled: Boolean(getSetting('features.invoicing.slidingFeeScale')),
  });

  return (
    <Document>
      {/* With no height, the page is as long as its content: one continuous strip of roll */}
      <Page size={[RECEIPT_WIDTH]} wrap={false} style={styles.page}>
        <HeaderSection certificateData={certificateData} />
        <Divider />
        <PatientDetailsSection patient={patientData} />
        <Divider />
        <InvoiceSection invoice={invoice} />
        <Divider />
        {items.length > 0 && (
          <>
            <LineItemsSection items={items} />
            <Divider />
          </>
        )}
        <DetailsSection totals={totals} />
        <Divider />
        <PatientTotalDueSection totals={totals} />
      </Page>
    </Document>
  );
};

export const InvoiceReceiptPrintout = withLanguageContext(
  withDateTimeContext(InvoiceReceiptPrintoutComponent),
);
