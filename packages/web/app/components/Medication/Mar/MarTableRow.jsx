import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import {
  findAdministrationTimeSlotFromIdealTime,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { TranslatedReferenceData, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { useTranslation } from '../../../contexts/Translation';
import { usePausesPrescriptionQuery } from '../../../api/queries/usePausesPrescriptionQuery';
import { useEncounter } from '../../../contexts/Encounter';
import { MarStatus } from './MarStatus';
import { MedicationDetails } from '../MedicationDetails';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/Auth';

const mapRecordsToWindows = (medicationAdministrationRecords = []) => {
  // Create an array of 12 null values (one for each time slot)
  const result = Array(12).fill(null);

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
  cursor: ${props => (props.$disabled ? 'default' : 'pointer')};
  &:hover {
    background-color: ${props => (props.$disabled ? 'transparent' : Colors.veryLightBlue)};
  }
`;

export const MarTableRow = ({
  medication,
  selectedDate,
  popperAnchorEl,
  onPopperAnchorElChange,
}) => {
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
  const { ability } = useAuth();
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');
  const isSensitive = medicationRef.referenceDrug.isSensitive;

  const queryClient = useQueryClient();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const pauseData = encounterPrescription?.pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;

  const [openMedicationDetails, setOpenMedicationDetails] = useState(false);

  const { data: pauseRecords } = usePausesPrescriptionQuery(medication.id, encounter?.id, {
    marDate: selectedDate,
  });

  const handleRefreshMar = () => {
    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    queryClient.invalidateQueries([`medication/${medication.id}/pauses`, encounter?.id]);
  };

  const handleRowClick = () => {
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    setOpenMedicationDetails(true);
  };

  return (
    <>
      <MarRowContainer
        discontinued={discontinued}
        isPausing={isPausing}
        onClick={handleRowClick}
        $disabled={isSensitive && !canViewSensitiveMedications}
      >
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
          {[
            getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
            getTranslatedFrequency(frequency, getTranslation),
            getEnumTranslation(DRUG_ROUTE_LABELS, route),
          ]
            .filter(Boolean)
            .join(', ')}
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
            anchorEl={popperAnchorEl}
            onAnchorElChange={onPopperAnchorElChange}
          />
        );
      })}
      {openMedicationDetails && (
        <MedicationDetails
          initialMedication={medication}
          onClose={() => setOpenMedicationDetails(false)}
          onReloadTable={handleRefreshMar}
        />
      )}
    </>
  );
};
