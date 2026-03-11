import { addDays, subDays, isSameDay } from 'date-fns';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import {
  ButtonWithPermissionCheck,
  DateDisplay as DateDisplayComponent,
  useDateTime,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Heading3, TranslatedText } from '../..';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { useEncounter } from '../../../contexts/Encounter';
import { ConditionalTooltip } from '../../Tooltip';
import { MedicationModal } from '../MedicationModal';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${Colors.white};
  padding: 2px 12px;
`;

const DateSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const DateDisplay = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkText};
  padding: 0 4px;
`;

const StepperButton = styled(IconButton)`
  padding: 0.25rem;
`;

const ButtonWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

export const MarHeader = ({ selectedDate, onDateChange }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const { encounter } = useEncounter();
  const { ability } = useAuth();
  const { getFacilityNowDate, toFacilityDateTime } = useDateTime();
  const canCreatePrescription = ability.can('create', 'Medication');

  const toFacilityDate = dateStr => {
    if (!dateStr) return null;
    const converted = toFacilityDateTime(dateStr);
    return converted ? new Date(converted) : null;
  };

  const facilityNow = getFacilityNowDate();
  const encounterStart = toFacilityDate(encounter?.startDate);
  const encounterEnd = toFacilityDate(encounter?.endDate);

  const goToPreviousDay = () => {
    onDateChange(prevDate => subDays(prevDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(prevDate => addDays(prevDate, 1));
  };

  const isPreviousDayDisabled = encounterStart && isSameDay(selectedDate, encounterStart);
  const isNextDayHidden =
    isSameDay(addDays(facilityNow, 2), selectedDate) ||
    (encounterEnd && isSameDay(encounterEnd, selectedDate));

  const isEncounterDischarged = !!encounter?.endDate;

  return (
    <Wrapper>
      <MedicationModal
        open={createMedicationModalOpen}
        encounterId={encounter?.id}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={async () => {
          setCreateMedicationModalOpen(false);
        }}
      />
      <Heading3 flex={1}>
        <TranslatedText stringId="encounter.mar.title" fallback="Medication admin record" />
      </Heading3>
      <DateSelectWrapper>
        <ConditionalTooltip
          visible={isPreviousDayDisabled}
          title={
            <TranslatedText
              fallback="Can't select date prior to encounter start date"
              stringId="medication.mar.tooltip.encounterStartDate"
            />
          }
          PopperProps={{
            modifiers: {
              flip: {
                enabled: false,
              },
              offset: {
                enabled: true,
                offset: '0, -15',
              },
            },
          }}
        >
          <StepperButton
            onClick={goToPreviousDay}
            disabled={isPreviousDayDisabled}
            data-testid="iconbutton-previousdate-abc123"
          >
            <ChevronLeft />
          </StepperButton>
        </ConditionalTooltip>
        <DateDisplay>
          <DateDisplayComponent date={selectedDate} format="long" noTooltip />
        </DateDisplay>
        {!isNextDayHidden && (
          <StepperButton onClick={goToNextDay} data-testid="iconbutton-nextdate-xyz789">
            <ChevronRight />
          </StepperButton>
        )}
      </DateSelectWrapper>
      <ButtonWrapper>
        {canCreatePrescription && (
          <NoteModalActionBlocker>
            <ConditionalTooltip
              visible={isEncounterDischarged}
              title={
                <TranslatedText
                  stringId="medication.action.newPrescription.tooltip"
                  fallback="A new prescription can't be created once an encounter has been discharged. Please add any ongoing medications via the patient-level Medications tab."
                />
              }
            >
              <ButtonWithPermissionCheck
                onClick={() => setCreateMedicationModalOpen(true)}
                verb="create"
                noun="Medication"
                disabled={isEncounterDischarged}
              >
                <TranslatedText
                  stringId="medication.action.newPrescription"
                  fallback="New prescription"
                />
              </ButtonWithPermissionCheck>
            </ConditionalTooltip>
          </NoteModalActionBlocker>
        )}
      </ButtonWrapper>
    </Wrapper>
  );
};
