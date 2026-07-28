import { Box } from '@material-ui/core';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

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
  <TranslatedText stringId="pharmacyOrder.orderingPrescriber.label" fallback="Ordering prescriber" />
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
      value={field.value || 0}
      onChange={field.onChange}
      unit={unit}
      {...props}
      data-testid="styledtextfield-4ea9"
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
    style: { inlineSize: '18em' },
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
      <Field
        name={`medications.${id}.quantity`}
        component={NumberFieldWithoutLabel}
        unitKey={dispensingUnit ?? undefined}
        min={1}
        required
        data-testid="field-ksmf"
        disabled={
          !canUpdateMedication ||
          (medication?.referenceDrug?.isSensitive && !canWriteSensitiveMedication)
        }
      />
    ),
    style: { inlineSize: '10em', minInlineSize: '10em' },
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
    style: { inlineSize: '8em', minInlineSize: '8em' },
  },
  {
    key: 'Ongoing',
    title: <TranslatedText stringId="discharge.table.column.ongoing" fallback="Ongoing" />,
    accessor: OngoingAccessor,
    style: { minWidth: 0 },
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
          style: { minWidth: 0 },
        },
        {
          key: 'lastSent',
          title: (
            <TranslatedText stringId="medication.table.column.lastSent" fallback="Last sent" />
          ),
          accessor: LastSentAccessor,
          style: { minWidth: 0 },
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
          style: { minWidth: 0 },
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
          style: { minWidth: 0 },
        },
      ]
    : []),
];
