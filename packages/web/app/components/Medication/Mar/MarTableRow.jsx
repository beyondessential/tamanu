import Box from '@mui/material/Box';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import {
  TAMANU_COLORS,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
  useTranslation,
} from '@tamanu/ui-components';
import { usePausesPrescriptionQuery } from '../../../api/queries/usePausesPrescriptionQuery';
import { useEncounter } from '../../../contexts/Encounter';
import { getDisplayedPharmacyNote } from '../../../utils/medications';
import { MedicationDetails } from '../MedicationDetails';
import { PrescriptionChangeHistoryModal } from '../PrescriptionChangeHistoryModal';
import { MarStatus } from './MarStatus';
import { getDosesPerSlot, mapRecordsToWindows } from './marTimeSlots';
import { MarCellButton } from './components';
import useCanViewMedication from './useCanViewMedication';

const TableRow = styled.tr(
  props => css`
    ${props.discontinued &&
    css`
      text-decoration: line-through;
    `}
    ${props.isPausing &&
    css`
      color: ${TAMANU_COLORS.softText};
      font-style: italic;
    `}
  `,
);

const TableRowHeader = styled(({ children, disabled, onClick, ...props }) => (
  <th scope="row" {...props}>
    <MarCellButton disabled={disabled} onClick={onClick}>
      {children}
    </MarCellButton>
  </th>
))`
  font-weight: inherit;
`;

const MedicationName = styled.span`
  font-weight: 500;
`;

const ViewChangeLink = styled.span`
  color: ${p => p.theme.palette.text.primary};
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
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
    encounterPrescription,
    latestModifiedDispense,
  } = medication;
  const { toFacilityDateTime } = useDateTime();
  const canViewMedication = useCanViewMedication(medicationRef);

  const queryClient = useQueryClient();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const pauseData = encounterPrescription?.pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;

  const [medicationDetailsOpen, setMedicationDetailsOpen] = useState(false);
  const [openModifyHistory, setOpenModifyHistory] = useState(false);

  const { modifiedPharmacyNote, displayedPharmacyNote } = getDisplayedPharmacyNote(medication);

  const handleViewChangeClick = event => {
    event.stopPropagation();
    setOpenModifyHistory(true);
  };

  const openMedicationDetails = () => {
    if (!canViewMedication) return;
    setMedicationDetailsOpen(true);
  };

  const { data: pauseRecords } = usePausesPrescriptionQuery(medication.id, encounter?.id, {
    marDate: selectedDate,
  });

  const dosesPerSlot = getDosesPerSlot(frequency);
  const recordsByWindow = mapRecordsToWindows(
    medicationAdministrationRecords,
    toFacilityDateTime,
    dosesPerSlot,
  );

  return (
    <>
      <TableRow discontinued={discontinued} isPausing={isPausing}>
        <TableRowHeader disabled={!canViewMedication} onClick={openMedicationDetails}>
          <MedicationName>
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
          </MedicationName>
          <div data-testid="mar-dosage">
            {[
              getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
              getTranslatedFrequency(frequency, getTranslation),
              getEnumTranslation(DRUG_ROUTE_LABELS, route),
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
          <Box color={!isPausing ? TAMANU_COLORS.midText : undefined}>
            <span>{notes}</span>
            {displayedPharmacyNote && (
              <span>
                {notes && ', '}
                <TranslatedText
                  stringId="medication.mar.pharmacyNotes"
                  fallback="Pharmacy note"
                />: {displayedPharmacyNote}
              </span>
            )}
            {modifiedPharmacyNote && (
              <>
                {' '}
                <ViewChangeLink onClick={handleViewChangeClick} data-testid="mar-view-change">
                  <TranslatedText stringId="medication.mar.viewChange" fallback="View change" />
                </ViewChangeLink>
              </>
            )}
          </Box>
        </TableRowHeader>
        {recordsByWindow.map((marInfos, index) => (
          <MarStatus
            key={marInfos.find(r => r?.id)?.id || index}
            selectedDate={selectedDate}
            timeSlot={MEDICATION_ADMINISTRATION_TIME_SLOTS[index]}
            medication={medication}
            marInfos={marInfos}
            previousWindowMarInfos={recordsByWindow[index - 1]}
            nextWindowMarInfos={recordsByWindow[index + 1]}
            pauseRecords={pauseRecords}
            anchorEl={popperAnchorEl}
            onAnchorElChange={onPopperAnchorElChange}
          />
        ))}
      </TableRow>
      {medicationDetailsOpen && (
        <MedicationDetails
          initialMedication={medication}
          onClose={() => setMedicationDetailsOpen(false)}
          onReloadTable={() => {
            queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
            queryClient.invalidateQueries([`medication/${medication.id}/pauses`, encounter?.id]);
          }}
        />
      )}
      <PrescriptionChangeHistoryModal
        open={openModifyHistory}
        dispenseId={latestModifiedDispense?.id}
        onClose={() => setOpenModifyHistory(false)}
      />
    </>
  );
};
