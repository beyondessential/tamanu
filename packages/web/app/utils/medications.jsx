import React from 'react';
import { Box } from '@mui/material';
import {
  ADMINISTRATION_FREQUENCY_SYNONYMS,
  DRUG_STOCK_STATUS_LABELS,
  DRUG_STOCK_STATUSES,
} from '@tamanu/constants';
import { camelCase } from 'lodash';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { TableCellTag, ThemedTooltip, TranslatedText } from '@tamanu/ui-components';
import styled from 'styled-components';
import { formatTime, TranslatedEnum } from '../components';
import { STOCK_STATUS_COLORS } from '../constants';

export const getTranslatedFrequencySynonyms = (frequenciesEnabled, getTranslation) => {
  const result = {};
  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).forEach(([frequency, synonyms]) => {
    if (!frequenciesEnabled?.[frequency]) return;
    const labelKey = getTranslation(
      `medication.frequency.${camelCase(frequency)}.label`,
      frequency,
    );

    const translatedSynonyms = synonyms.map((synonym, index) =>
      getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, synonym),
    );

    result[labelKey] = translatedSynonyms;
  });

  return result;
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
