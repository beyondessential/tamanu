import React from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { Colors } from '../../../constants';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../..';
import { useTranslation } from '../../../contexts/Translation';
import { getDose, getTranslatedFrequency } from '../../../utils/medications';
import { findAdministrationTimeSlotFromIdealTime } from '@tamanu/shared/utils/medication';
import { usePausesPrescriptionQuery } from '../../../api/queries/usePausesPrescriptionQuery';
import { useEncounter } from '../../../contexts/Encounter';
import { MarStatus } from './MarStatus';

const mapRecordsToWindows = medicationAdministrationRecords => {
  // Create an array of 12 nulls (one for each 2-hour window)
  const result = Array(12).fill(null);

  // Process each medication administration record
  medicationAdministrationRecords.forEach(record => {
    const dueAt = new Date(record.dueAt);
    const windowIndex = findAdministrationTimeSlotFromIdealTime(dueAt).index;
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
  ${props => props.isPausing && `color: ${Colors.softText}; font-style: italic;`}
`;

export const MarTableRow = ({ medication, selectedDate }) => {
  const {
    medication: medicationRef,
    frequency,
    route,
    notes,
    discontinued,
    medicationAdministrationRecords,
    pharmacyNotes,
    displayPharmacyNotesInMar,
    encounterPrescription,
  } = medication;
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const pauseData = encounterPrescription?.pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;

  const { data: pauseRecords } = usePausesPrescriptionQuery(medication.id, encounter?.id, {
    marDate: selectedDate,
  });

  return (
    <>
      <MarRowContainer discontinued={discontinued} isPausing={isPausing}>
        <Box fontWeight={500}>
          <TranslatedReferenceData
            fallback={medicationRef.name}
            value={medicationRef.id}
            category={medicationRef.type}
          />
          {isPausing && (
            <>
              {' '}
              <TranslatedText stringId="medication.mar.paused.label" fallback="(Paused)" />
            </>
          )}
        </Box>
        <Box>
          {getDose(medication, getTranslation, getEnumTranslation)},{' '}
          {getTranslatedFrequency(frequency, getTranslation)},{' '}
          {<TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />}
        </Box>
        <Box color={!isPausing ? Colors.midText : undefined}>
          <span>{notes}</span>
          {displayPharmacyNotesInMar && pharmacyNotes && (
            <span>
              {notes && ', '}
              <TranslatedText
                stringId="medication.mar.pharmacyNotes"
                fallback="Pharmacy note"
              />: {pharmacyNotes}
            </span>
          )}
        </Box>
      </MarRowContainer>
      {mapRecordsToWindows(medicationAdministrationRecords).map((record, index, array) => {
        return (
          <MarStatus
            key={record?.id || index}
            selectedDate={selectedDate}
            timeSlot={MEDICATION_ADMINISTRATION_TIME_SLOTS[index]}
            medication={medication}
            marInfo={record}
            previousMarInfo={array[index - 1]}
            nextMarInfo={array[index + 1]}
            pauseRecords={pauseRecords}
          />
        );
      })}
    </>
  );
};
