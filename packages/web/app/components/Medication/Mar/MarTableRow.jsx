import Box from '@mui/material/Box';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import {
  findAdministrationTimeSlotFromIdealTime,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import {
  TAMANU_COLORS,
  TranslatedReferenceData,
  TranslatedText,
  UnstyledHtmlButton,
  useDateTime,
  useTranslation,
} from '@tamanu/ui-components';
import { usePausesPrescriptionQuery } from '../../../api/queries/usePausesPrescriptionQuery';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { getDisplayedPharmacyNote } from '../../../utils/medications';
import { MedicationDetails } from '../MedicationDetails';
import { PrescriptionChangeHistoryModal } from '../PrescriptionChangeHistoryModal';
import { MarStatus } from './MarStatus';

/**
 * @param {{ dueAt: string, id?: string }[]} [medicationAdministrationRecords]
 * @param {import('@tamanu/ui-components').DateTimeContextValue['toFacilityDateTime']} toFacilityDateTime
 * @returns {({ dueAt: string, id?: string } | null)[]}
 */
const mapRecordsToWindows = (medicationAdministrationRecords = [], toFacilityDateTime) => {
  const result = Array(MEDICATION_ADMINISTRATION_TIME_SLOTS.length).fill(null);

  medicationAdministrationRecords.forEach(record => {
    const facilityDueAt = toFacilityDateTime(record.dueAt);
    const facilityTime = facilityDueAt?.split('T')[1]?.substring(0, 5);
    if (!facilityTime) return;
    const windowIndex = findAdministrationTimeSlotFromIdealTime(facilityTime).index;
    result[windowIndex] = record;
  });

  return result;
};

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

const Th = styled.th.attrs({ scope: 'row' })`
  font-weight: inherit;
  && {
    padding: 0;
  }
`;

const UnstyledButton = styled(UnstyledHtmlButton)`
  block-size: 100%;
  inline-size: 100%;
  padding: 10px;
  &:not(:disabled) {
    cursor: pointer;
  }
  &:not(:disabled):is(:active, :focus-visible, :hover) {
    background-color: ${p => p.theme.palette.action.hover};
  }
`;

function RowHeader({ children, disabled, onClick, ...props }) {
  return (
    <Th {...props}>
      <UnstyledButton disabled={disabled} onClick={onClick}>
        {children}
      </UnstyledButton>
    </Th>
  );
}

const MedicationName = styled.span`
  font-weight: 500;
`;

const ViewChangeLink = styled.span`
  color: ${Colors.darkestText};
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
  const { ability } = useAuth();
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');
  const isSensitive = medicationRef.referenceDrug?.isSensitive;

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
    if (isSensitive && !canViewSensitiveMedications) return;
    setMedicationDetailsOpen(true);
  };

  const { data: pauseRecords } = usePausesPrescriptionQuery(medication.id, encounter?.id, {
    marDate: selectedDate,
  });

  const handleRefreshMar = () => {
    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    queryClient.invalidateQueries([`medication/${medication.id}/pauses`, encounter?.id]);
  };

  return (
    <>
      <TableRow discontinued={discontinued} isPausing={isPausing}>
        <RowHeader
          disabled={isSensitive && !canViewSensitiveMedications}
          onClick={openMedicationDetails}
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
          <Box color={!isPausing ? Colors.midText : undefined}>
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
        </RowHeader>
        {mapRecordsToWindows(medicationAdministrationRecords, toFacilityDateTime).map(
          (record, index, array) => (
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
          ),
        )}
      </TableRow>
      {medicationDetailsOpen && (
        <MedicationDetails
          initialMedication={medication}
          onClose={() => setMedicationDetailsOpen(false)}
          onReloadTable={handleRefreshMar}
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
