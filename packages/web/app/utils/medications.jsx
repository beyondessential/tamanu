import React from 'react';
import { Box } from '@mui/material';
import {
  DRUG_STOCK_STATUS_LABELS,
  DRUG_STOCK_STATUSES,
} from '@tamanu/constants';
import { camelCase } from 'lodash';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import {
  getPatientNameAsString,
  TableCellTag,
  ThemedTooltip,
  TranslatedText,
} from '@tamanu/ui-components';
import styled from 'styled-components';
import { formatTime, TranslatedEnum } from '../components';
import { STOCK_STATUS_COLORS } from '../constants';

/**
 * Transforms selected dispensable medication items into label data for printing.
 * @param {Object} params
 * @param {Array} params.items - The selected medication items to dispense
 * @param {Object} params.patient - The patient object
 * @param {Object} params.facility - The facility object
 * @returns {Array} Array of label data objects for printing
 */
export const getMedicationLabelData = ({ items, patient, facility }) => {
  const facilityAddress = [facility?.streetAddress, facility?.cityTown].filter(Boolean).join(', ');

  return items.map(item => ({
    id: item.id,
    medicationName: item.medicationName || '-',
    instructions: item.instructions || '',
    patientName: patient ? getPatientNameAsString(patient) : '-',
    dispensedAt: item.dispensedAt || new Date().toISOString(),
    quantity: item.quantity,
    units: item.units || '',
    remainingRepeats: item.remainingRepeats,
    prescriberName: item.prescriberName || '-',
    requestNumber: item.requestNumber || '-',
    facilityName: facility?.name || '',
    facilityAddress,
    facilityContactNumber: facility?.contactNumber || '',
  }));
};

export const getTranslatedFrequencySynonym = (synonyms, index, getTranslation) => {
  const frequency = synonyms[index];
  return getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, frequency);
};

export const formatTimeSlot = time => {
  return formatTime(time)
    .replaceAll(' ', '')
    .toLowerCase();
};

export const isWithinTimeSlot = (timeSlot, time, isFuture = false) => {
  if (!time || !timeSlot || isFuture) return true; // Skip validation if no value or timeSlot or isFuture

  // Convert times to minutes since midnight for easier comparison
  const timeToMinutes = date => date.getHours() * 60 + date.getMinutes();

  // Get the minutes for the selected time
  const selectedTimeMinutes = timeToMinutes(new Date(time));

  const slotStartMinutes = timeToMinutes(getDateFromTimeString(timeSlot.startTime));
  const slotEndMinutes = timeToMinutes(getDateFromTimeString(timeSlot.endTime));

  // Check if the time slot crosses midnight
  if (slotEndMinutes < slotStartMinutes) {
    // For time slots that cross midnight
    return selectedTimeMinutes >= slotStartMinutes || selectedTimeMinutes <= slotEndMinutes;
  } else {
    // For normal time slots within the same day
    return selectedTimeMinutes >= slotStartMinutes && selectedTimeMinutes <= slotEndMinutes;
  }
};

const StyledTag = styled(TableCellTag)`
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 18px;
`;

export const createPrescriptionHash = prescription =>
  `${prescription.medicationId}-${prescription.doseAmount}-${prescription.units}-${prescription.route}-${prescription.frequency}`;

export const getStockStatus = ({ prescription }, useStyledTag = true) => {
  const status =
    prescription.medication?.referenceDrug?.facilities?.[0]?.stockStatus ||
    DRUG_STOCK_STATUSES.UNKNOWN;
  const quantity = prescription.medication?.referenceDrug?.facilities?.[0]?.quantity || 0;

  const color = STOCK_STATUS_COLORS[status];

  const content = useStyledTag ? (
    <StyledTag $color={color} noWrap>
      <TranslatedEnum value={status} enumValues={DRUG_STOCK_STATUS_LABELS} />
    </StyledTag>
  ) : (
    <TranslatedEnum value={status} enumValues={DRUG_STOCK_STATUS_LABELS} />
  );

  if (status === DRUG_STOCK_STATUSES.IN_STOCK) {
    return (
      <ThemedTooltip
        title={
          <Box maxWidth="75px">
            <TranslatedText
              stringId="medication.stockLevel.tooltip"
              fallback="Stock level: :quantity units"
              replacements={{ quantity }}
            />
          </Box>
        }
      >
        <span>{content}</span>
      </ThemedTooltip>
    );
  }
  return content;
};
