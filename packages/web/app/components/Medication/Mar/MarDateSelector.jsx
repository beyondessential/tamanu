import IconButton from '@mui/material/IconButton';
import { addDays, isSameDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

import {
  ConditionalTooltip,
  DateDisplay,
  TranslatedText,
  useDateTime,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { useEncounter } from '../../../contexts/Encounter';

const DateSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const StyledDateDisplay = styled(DateDisplay)`
  color: ${p => p.theme.palette.text.secondary};
  font-size: 14px;
  font-weight: 500;
  padding-inline: 4px;
`;

const StepperButton = styled(IconButton)`
  padding: 0.25rem;
`;

const popperProps = /** @type {const} */ ({
  modifiers: {
    flip: {
      enabled: false,
    },
    offset: {
      enabled: true,
      offset: '0, -15',
    },
  },
});

export const MarDateSelector = ({ selectedDate, onDateChange }) => {
  const { encounter } = useEncounter();
  const { getFacilityNowDate, toFacilityDateTime } = useDateTime();

  const toFacilityDate = dateStr => {
    if (!dateStr) return null;
    const converted = toFacilityDateTime(dateStr);
    return converted ? new Date(converted) : null;
  };

  const facilityNow = getFacilityNowDate();
  const encounterStart = toFacilityDate(encounter?.startDate);
  const encounterEnd = toFacilityDate(encounter?.endDate);

  const goToPreviousDay = () => void onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => void onDateChange(addDays(selectedDate, 1));

  const isPreviousDayDisabled = encounterStart && isSameDay(selectedDate, encounterStart);
  const isNextDayHidden =
    isSameDay(addDays(facilityNow, 2), selectedDate) ||
    (encounterEnd && isSameDay(encounterEnd, selectedDate));

  return (
    <DateSelectWrapper>
      <ConditionalTooltip
        visible={isPreviousDayDisabled}
        title={
          <TranslatedText
            fallback="Can’t select date prior to encounter start date"
            stringId="medication.mar.tooltip.encounterStartDate"
          />
        }
        PopperProps={popperProps}
      >
        <StepperButton
          onClick={goToPreviousDay}
          disabled={isPreviousDayDisabled}
          data-testid="iconbutton-previousdate-abc123"
        >
          <ChevronLeft />
          <VisuallyHidden>
            <TranslatedText stringId="general.date.previousDay" fallback="Previous day" />
          </VisuallyHidden>
        </StepperButton>
      </ConditionalTooltip>
      <StyledDateDisplay date={selectedDate} format="long" noTooltip />
      <StepperButton
        disabled={isNextDayHidden}
        onClick={goToNextDay}
        data-testid="iconbutton-nextdate-xyz789"
      >
        <ChevronRight />
        <VisuallyHidden>
          <TranslatedText stringId="general.date.nextDay" fallback="Next day" />
        </VisuallyHidden>
      </StepperButton>
    </DateSelectWrapper>
  );
};
