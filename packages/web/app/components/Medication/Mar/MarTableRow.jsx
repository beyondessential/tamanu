import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';

import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import {
  TranslatedReferenceData,
  TranslatedText,
  UnstyledHtmlButton,
  useDateTime,
  useTranslation,
} from '@tamanu/ui-components';
import { usePausesPrescriptionQuery } from '../../../api/queries/usePausesPrescriptionQuery';
import { useEncounter } from '../../../contexts/Encounter';
import { getDisplayedPharmacyNote } from '../../../utils/medications';
import { MedicationDetails } from '../MedicationDetails';
import { PrescriptionChangeHistoryModal } from '../PrescriptionChangeHistoryModal';
import { MarHeaderCellButton } from './components';
import MarCell from './DoseCell/MarCell';
import { getDosesPerSlot, mapRecordsToWindows } from './marTimeSlots';
import useCanViewMedication from './useCanViewMedication';

const TableRowHeader = styled(({ children, disabled, discontinued, paused, onClick, ...props }) => (
  <th scope="row" {...props}>
    <MarHeaderCellButton
      data-discontinued={discontinued}
      data-paused={paused}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </MarHeaderCellButton>
  </th>
))`
  font-weight: inherit;
`;

const MedicationName = styled.span`
  font-weight: 500;
`;

const PharmacyNote = styled.div`
  color: ${p => p.theme.palette.text.tertiary};
`;

const ViewChangeLink = styled(UnstyledHtmlButton)`
  color: ${p => p.theme.palette.text.primary};
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
  &:hover {
    color: ${p => p.theme.palette.primary.main};
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
      <tr>
        <TableRowHeader
          disabled={!canViewMedication}
          discontinued={discontinued}
          onClick={openMedicationDetails}
          paused={isPausing}
        >
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
          <PharmacyNote>
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
          </PharmacyNote>
        </TableRowHeader>
        {recordsByWindow.map((marInfos, index) => (
          <MarCell
            key={marInfos.find(r => r?.id)?.id || index}
            selectedDate={selectedDate}
            timeSlot={MEDICATION_ADMINISTRATION_TIME_SLOTS[index]}
            medication={medication}
            marInfos={marInfos}
            nextWindowMarInfos={recordsByWindow[index + 1]}
            pauseRecords={pauseRecords}
            anchorEl={popperAnchorEl}
            onAnchorElChange={onPopperAnchorElChange}
          />
        ))}
      </tr>
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
