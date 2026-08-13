import { Box } from '@material-ui/core';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { MAX_REPEATS, MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';
import {
  getDrugUnitLabel,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import {
  AutocompleteField,
  DateDisplay,
  Field,
  NumberInput,
  RequiredOrnament,
  TranslatedReferenceData,
  TranslatedText,
  useTranslation,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { CheckField } from '../components/Field';
import { Colors } from '../constants';
import { preventInvalidRepeatsInput, singularize } from '../utils';
import { getStockStatus } from '../utils/medications';
import { atLeastOneWhenSendingToPharmacy, emptyToNull } from '../utils/validation';

const DarkestText = styled(Box)`
  color: ${Colors.darkestText};
  font-size: 14px;
`;

const OrderingPrescriberWrapper = styled(Box)`
  inline-size: 45%;
  font-weight: 400;
`;

export const dispensingQuantityLabel = (
  <TranslatedText stringId="discharge.table.column.dispensingQuantity" fallback="Dispensing qty" />
);

export const orderingPrescriberLabel = (
  <TranslatedText
    stringId="pharmacyOrder.orderingPrescriber.label"
    fallback="Ordering prescriber"
  />
);

/**
 * Every listed medication needs a dispensing quantity, in both tables and whether or not pharmacy
 * orders are enabled — the discharge records it against the prescription either way. Zero only
 * stops being acceptable once the row is actually being sent to pharmacy.
 */
export const getMedicationsValidationSchema = requiredInlineMessage =>
  yup.lazy(medications =>
    yup.object(
      Object.keys(medications ?? {}).reduce((schemas, key) => {
        schemas[key] = yup.object().shape({
          quantity: yup
            .number()
            .transform(emptyToNull)
            .integer()
            .min(0)
            // Nullable so a blank field fails as required rather than as a bad number.
            .nullable()
            .required(requiredInlineMessage)
            .translatedLabel(dispensingQuantityLabel)
            .test(atLeastOneWhenSendingToPharmacy(requiredInlineMessage)),
          repeats: yup
            .number()
            .transform(emptyToNull)
            .integer()
            .min(0)
            .max(MAX_REPEATS)
            .nullable()
            .optional(),
        });
        return schemas;
      }, {}),
    ),
  );

/**
 * The prescriber placing the pharmacy order. Sits in the encounter medication header rather than
 * the form grid, because it belongs to the medications being sent rather than to the discharge.
 */
export const OrderingPrescriberField = ({ practitionerSuggester }) => {
  const { values } = useFormikContext();
  const isSendingAnyMedication = Object.values(values.medications ?? {}).some(
    medication => medication?.sendToPharmacy,
  );

  return (
    <OrderingPrescriberWrapper>
      <Field
        name="pharmacyOrder.orderingClinicianId"
        label={orderingPrescriberLabel}
        component={AutocompleteField}
        suggester={practitionerSuggester}
        infoTooltip={
          <Box width="150px">
            <TranslatedText
              stringId="pharmacyOrder.orderingPrescriber.tooltip"
              fallback="The prescriber who is placing the pharmacy order."
            />
          </Box>
        }
        required
        disabled={!isSendingAnyMedication}
        data-testid="field-orderingprescriber"
      />
    </OrderingPrescriberWrapper>
  );
};

const NumberFieldWithoutLabel = ({ field, unitKey, ...props }) => {
  const { getEnumTranslation } = useTranslation();
  const unit = unitKey ? getDrugUnitLabel(unitKey, field.value, getEnumTranslation) : undefined;
  return (
    <NumberInput
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      unit={unit}
      {...props}
      data-testid="styledtextfield-4ea9"
    />
  );
};

/** Mirrors getMedicationsValidationSchema: the floor lifts to 1 only once the row is being sent. */
const DispensingQuantityField = ({ medicationId, dispensingUnit, disabled }) => {
  const { values } = useFormikContext();
  const isSentToPharmacy = Boolean(values.medications?.[medicationId]?.sendToPharmacy);

  return (
    <Field
      name={`medications.${medicationId}.quantity`}
      component={NumberFieldWithoutLabel}
      unitKey={dispensingUnit ?? undefined}
      min={isSentToPharmacy ? 1 : 0}
      required
      disabled={disabled}
      data-testid="field-ksmf"
    />
  );
};

const MedicationAccessor = ({ medication, getTranslation, getEnumTranslation }) => {
  const { medication: medicationReferenceData } = medication;
  const translatedUnit = getEnumTranslation(
    MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
    medication.durationUnit,
  );
  const durationDisplay =
    medication.durationValue && translatedUnit
      ? `${medication.durationValue} ${singularize(
          translatedUnit,
          medication.durationValue,
        ).toLowerCase()}`
      : null;
  return (
    <Box>
      <DarkestText>
        <TranslatedReferenceData
          fallback={medicationReferenceData.name}
          value={medicationReferenceData.id}
          category={medicationReferenceData.type}
        />
      </DarkestText>
      <Box fontSize={'14px'} color={Colors.midText}>
        {[
          getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
          getTranslatedFrequency(medication.frequency, getTranslation),
          durationDisplay,
        ]
          .filter(Boolean)
          .join(', ')}
      </Box>
    </Box>
  );
};

const OngoingAccessor = ({ isOngoing }) => (
  <DarkestText>
    {isOngoing ? (
      <TranslatedText stringId="general.yes" fallback="Yes" />
    ) : (
      <TranslatedText stringId="general.no" fallback="No" />
    )}
  </DarkestText>
);

const DiscontinuedAccessor = ({ medication, handleDiscontinueMedication }) => (
  <DarkestText
    style={{ textDecoration: 'underline', cursor: 'pointer' }}
    onClick={() => handleDiscontinueMedication(medication)}
  >
    <TranslatedText stringId="discharge.table.discontinue" fallback="Discontinue" />
  </DarkestText>
);

const LastSentAccessor = ({ lastOrderedAt, isLastOrderDispensed }) => {
  if (!lastOrderedAt) {
    return (
      <DarkestText>
        <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
      </DarkestText>
    );
  }
  return (
    <Box>
      <DarkestText>
        <DateDisplay date={lastOrderedAt} format="shortest" />
      </DarkestText>
      <Box fontSize="12px" color={Colors.softText}>
        {isLastOrderDispensed ? (
          <TranslatedText
            stringId="medication.pharmacyRequest.status.dispensed"
            fallback="Dispensed"
          />
        ) : (
          <TranslatedText
            stringId="medication.pharmacyRequest.status.activeRequest"
            fallback="Active request"
          />
        )}
      </Box>
    </Box>
  );
};

/*
 * The discharge medication tables use fixed layout so the two of them stay aligned with each other,
 * which means any column without a declared width just takes an equal share of whatever is left.
 * That starved the trailing columns and clipped "Discontinue", so every column states its own share
 * instead. Percentages rather than ems so the budget holds at any form width.
 *
 * The full set sums to 100%; when the optional columns are absent the browser shares the remainder
 * out over the columns that are present. Nudge these if a column still wraps awkwardly.
 */
const COLUMN_WIDTHS = {
  medication: '21%',
  quantity: '15%',
  repeats: '11%',
  ongoing: '11%',
  sendToPharmacy: '12%',
  lastSent: '11%',
  stock: '9%',
  discontinued: '10%',
};

export const MEDICATION_COLUMNS = ({
  getTranslation,
  getEnumTranslation,
  handleDiscontinueMedication,
  canUpdateMedication,
  canWriteSensitiveMedication,
  isPharmacyOrderEnabled = false,
  showStockColumn = false,
}) => [
  {
    key: 'medication',
    title: <TranslatedText stringId="discharge.table.column.medication" fallback="Medication" />,
    accessor: medication => (
      <MedicationAccessor
        medication={medication}
        getTranslation={getTranslation}
        getEnumTranslation={getEnumTranslation}
      />
    ),
    style: { inlineSize: COLUMN_WIDTHS.medication },
  },
  {
    key: 'quantity',
    title: (
      <>
        {dispensingQuantityLabel}
        <RequiredOrnament />
      </>
    ),
    accessor: ({ id, medication, dispensingUnit }) => (
      <DispensingQuantityField
        medicationId={id}
        dispensingUnit={dispensingUnit}
        disabled={
          !canUpdateMedication ||
          (medication?.referenceDrug?.isSensitive && !canWriteSensitiveMedication)
        }
      />
    ),
    style: { inlineSize: COLUMN_WIDTHS.quantity },
  },
  {
    key: 'repeats',
    title: <TranslatedText stringId="discharge.table.column.repeats" fallback="Repeats" />,
    accessor: ({ id, medication }) => (
      <Field
        name={`medications.${id}.repeats`}
        component={NumberFieldWithoutLabel}
        min={0}
        max={MAX_REPEATS}
        data-testid="field-ium3"
        disabled={
          !canUpdateMedication ||
          (medication?.referenceDrug?.isSensitive && !canWriteSensitiveMedication)
        }
        step={1}
        onInput={preventInvalidRepeatsInput}
      />
    ),
    style: { inlineSize: COLUMN_WIDTHS.repeats },
  },
  {
    key: 'Ongoing',
    title: <TranslatedText stringId="discharge.table.column.ongoing" fallback="Ongoing" />,
    accessor: OngoingAccessor,
    style: { inlineSize: COLUMN_WIDTHS.ongoing },
  },
  ...(isPharmacyOrderEnabled
    ? [
        {
          key: 'sendToPharmacy',
          title: (
            <TranslatedText
              stringId="discharge.table.column.sendToPharmacy"
              fallback="Send to pharmacy"
            />
          ),
          accessor: ({ id }) => (
            <Field
              name={`medications.${id}.sendToPharmacy`}
              component={CheckField}
              data-testid="field-sendtopharmacy"
            />
          ),
          style: { inlineSize: COLUMN_WIDTHS.sendToPharmacy },
        },
        {
          key: 'lastSent',
          title: (
            <TranslatedText stringId="medication.table.column.lastSent" fallback="Last sent" />
          ),
          accessor: LastSentAccessor,
          style: { inlineSize: COLUMN_WIDTHS.lastSent },
        },
      ]
    : []),
  ...(isPharmacyOrderEnabled && showStockColumn
    ? [
        {
          key: 'stock',
          title: (
            <TranslatedText
              stringId="medication-requests.table.column.stockStatus"
              fallback="Stock"
            />
          ),
          accessor: medication => (
            <DarkestText>{getStockStatus({ prescription: medication }, false)}</DarkestText>
          ),
          style: { inlineSize: COLUMN_WIDTHS.stock },
        },
      ]
    : []),
  ...(canUpdateMedication
    ? [
        {
          key: 'Discontinued',
          title: (
            <VisuallyHidden>
              <TranslatedText stringId="medication.details.discontinue" fallback="Discontinue" />
            </VisuallyHidden>
          ),
          accessor: medication =>
            medication?.medication?.referenceDrug?.isSensitive && !canWriteSensitiveMedication ? (
              <div />
            ) : (
              <DiscontinuedAccessor
                medication={medication}
                handleDiscontinueMedication={handleDiscontinueMedication}
              />
            ),
          style: { inlineSize: COLUMN_WIDTHS.discontinued },
        },
      ]
    : []),
];
