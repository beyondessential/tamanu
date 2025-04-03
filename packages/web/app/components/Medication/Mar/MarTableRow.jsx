import React from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { Colors } from '../../../constants';
import { TranslatedEnum, TranslatedReferenceData } from '../..';
import { useTranslation } from '../../../contexts/Translation';
import { getDose, getTranslatedFrequency } from '../../../utils/medications';
import { MarStatus } from '../MarStatus';
import { findAdministrationTimeSlotFromIdealTime } from '@tamanu/shared/utils/medication';

const mapRecordsToWindows = medicationAdministrationRecords => {
  // Create an array of 12 nulls (one for each 2-hour window)
  const result = Array(12).fill(null);

  // Process each medication administration record
  medicationAdministrationRecords.forEach(record => {
    const administeredAt = new Date(record.administeredAt);
    const windowIndex = findAdministrationTimeSlotFromIdealTime(
      `${administeredAt.getHours()}:${administeredAt.getMinutes()}`,
    ).index;
    result[windowIndex] = record;
  });

  return result;
};

const MarRowContainer = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  ${props => props.discontinued && `text-decoration: line-through;`}
`;

export const MarTableRow = ({ medication, selectedDate }) => {
  const {
    medication: medicationRef,
    frequency,
    route,
    notes,
    discontinued,
    medicationAdministrationRecords,
  } = medication;
  const { getTranslation, getEnumTranslation } = useTranslation();

  return (
    <>
      <MarRowContainer discontinued={discontinued}>
        <Box fontWeight={500}>
          <TranslatedReferenceData
            fallback={medicationRef.name}
            value={medicationRef.id}
            category={medicationRef.type}
          />
        </Box>
        <Box>
          {getDose(medication, getTranslation, getEnumTranslation)},{' '}
          {getTranslatedFrequency(frequency, getTranslation)},{' '}
          {<TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />}
        </Box>
        <Box color={Colors.midText}>{notes}</Box>
      </MarRowContainer>
      {mapRecordsToWindows(medicationAdministrationRecords).map((record, index) => {
        return (
          <MarStatus
            key={record?.id || index}
            selectedDate={selectedDate}
            timeSlot={MEDICATION_ADMINISTRATION_TIME_SLOTS[index]}
            medication={medication}
            marInfo={record}
          />
        );
      })}
    </>
  );
};
