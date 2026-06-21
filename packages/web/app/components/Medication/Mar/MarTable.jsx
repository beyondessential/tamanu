import { isSameDay } from 'date-fns';
import { partition } from 'lodash';
import React, { useState } from 'react';
import styled from 'styled-components';

import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { TranslatedText, useDateTime } from '@tamanu/ui-components';
import { toDateString } from '@tamanu/utils/dateTime';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { Colors } from '../../../constants';
import { useEncounter } from '../../../contexts/Encounter';
import { MarTableRow } from './MarTableRow';

const Table = styled.table.attrs({ role: 'table' })`
  --mar-table-border: 1px solid ${p => p.theme.palette.divider};
  border-collapse: collapse;
  font-size: 12px;
  inline-size: 100%;
  position: relative;

  & col[aria-current='time'] {
    border: 1px solid ${p => p.theme.palette.primary.main};
    color: ${p => p.theme.palette.primary.main};
  }

  & :is(th, td) {
    padding: 10px;
    border-block-start: var(--mar-table-border);
    border-inline-start: var(--mar-table-border);
    &:last-child {
      border-block-end: var(--mar-table-border);
      border-inline-end: var(--mar-table-border);
    }
  }
`;

const HeaderRow = styled.thead.attrs({ role: 'rowgroup' })`
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TableHeaderCell = styled.th.attrs({ scope: 'col' })`
  &:not(:first-child) {
    inline-size: 4em;
  }
  &:last-child {
    border-inline-end: 1px solid ${p => p.theme.palette.divider};
  }
`;

const HeadingCell = styled(TableHeaderCell)`
  font-size: 16px;
  font-weight: 500;
`;

const TimeSlotHeaderContainer = styled(TableHeaderCell)`
  align-items: center;
  color: ${p => p.theme.palette.text.tertiary};
  font-weight: 400;
  min-block-size: 8.75em;
  vertical-align: bottom;

  &[aria-current='time'] {
    background-color: #ebf0f5;
    color: ${p => p.theme.palette.primary.main};
  }
`;

const TimeSlotText = styled.div`
  block-size: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  rotate: 0.5turn;
  text-orientation: sideways;
  writing-mode: vertical-rl;
`;

const TimeSlotLabel = styled.div`
  text-transform: capitalize;
  color: ${p => p.theme.palette.text.primary};
`;

const FullSpanTableCell = styled.td.attrs({
  colSpan: MEDICATION_ADMINISTRATION_TIME_SLOTS.length + 1,
})``;

function EmptyStateRow(props) {
  return (
    <tr>
      <FullSpanTableCell {...props} />
    </tr>
  );
}

const HeadingTableCell = styled.th.attrs({ scope: 'rowgroup' })`
  color: ${Colors.midText};
  font-size: 14px;
  font-weight: 500;
  position: sticky;
  z-index: 5;
`;

function HeadingRow(props) {
  return (
    <tr>
      {/* Not using colspan attribute so col[aria-current='time'] style is uninterrupted */}
      <HeadingTableCell {...props} />
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime }) => (
        <th aria-hidden key={startTime} style={{ borderInline: 'none' }} />
      ))}
    </tr>
  );
}

function useIsCurrentTimeSlot({ startTime, endTime, selectedDate }) {
  const { getFacilityNowDate } = useDateTime();
  const facilityNow = getFacilityNowDate();
  const now = facilityNow.getTime();
  const startDate = getDateFromTimeString(startTime, facilityNow).getTime();
  const endDate = getDateFromTimeString(endTime, facilityNow).getTime();
  return startDate <= now && now <= endDate && isSameDay(selectedDate, facilityNow);
}

function Col({ startTime, endTime, selectedDate }) {
  const current = useIsCurrentTimeSlot({ startTime, endTime, selectedDate });
  return <col aria-current={current ? 'time' : undefined} />;
}

// Convert time string to locale-specific time string no timezone conversion is applied
const formatSlotTime = (timeStr, locale) =>
  Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true }).format(
    new Date(`2000-01-01T${timeStr === '24:00' ? '00:00' : timeStr}:00`),
  );

const TimeSlotHeader = ({ periodLabel, startTime, endTime, selectedDate }) => {
  const current = useIsCurrentTimeSlot({ startTime, endTime, selectedDate });
  return (
    <TimeSlotHeaderContainer aria-current={current ? 'time' : undefined}>
      <TimeSlotText>
        {periodLabel && <TimeSlotLabel>{periodLabel}</TimeSlotLabel>}
        <div>
          {formatSlotTime(startTime)}&thinsp;&ndash;&thinsp;{formatSlotTime(endTime)}
        </div>
      </TimeSlotText>
    </TimeSlotHeaderContainer>
  );
};

export const MarTable = ({ selectedDate }) => {
  const { encounter } = useEncounter();
  const [popperAnchorEl, setPopperAnchorEl] = useState(null);

  const { data: medicationsData, isLoading: isLoadingMedications } = useEncounterMedicationQuery(
    encounter?.id,
    {
      marDate: toDateString(selectedDate),
      orderBy: 'date',
      order: 'asc',
    },
  );
  const medications =
    medicationsData?.data?.sort((a, b) => {
      if (a.discontinued === b.discontinued) return 0;
      return a.discontinued ? 1 : -1;
    }) ?? [];
  const [prnMedications, scheduledMedications] = partition(
    medications,
    medication => medication.isPrn,
  );

  return (
    <Table columns={MEDICATION_ADMINISTRATION_TIME_SLOTS.length}>
      <colgroup>
        <col />
        {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime, endTime }) => (
          <Col
            key={startTime}
            startTime={startTime}
            endTime={endTime}
            selectedDate={selectedDate}
          />
        ))}
      </colgroup>
      <HeaderRow>
        <HeadingCell>
          <TranslatedText fallback="Medication" stringId="medication.mar.medication.label" />
        </HeadingCell>
        {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ periodLabel, startTime, endTime }) => (
          <TimeSlotHeader
            key={startTime}
            periodLabel={periodLabel}
            startTime={startTime}
            endTime={endTime}
            selectedDate={selectedDate}
          />
        ))}
      </HeaderRow>
      <tbody>
        <HeadingRow>
          <TranslatedText
            fallback="Scheduled medication"
            stringId="medication.mar.scheduledMedication.label"
          />
        </HeadingRow>
        {isLoadingMedications ? (
          <EmptyStateRow>
            <TranslatedText stringId="general.table.loading" fallback="Loading…" />
          </EmptyStateRow>
        ) : scheduledMedications.length ? (
          scheduledMedications.map(medication => (
            <MarTableRow
              key={medication?.id}
              medication={medication}
              selectedDate={selectedDate}
              popperAnchorEl={popperAnchorEl}
              onPopperAnchorElChange={setPopperAnchorEl}
            />
          ))
        ) : (
          <EmptyStateRow>
            <TranslatedText
              fallback="No scheduled medication to display"
              stringId="medication.mar.noScheduledMedication.label"
            />
          </EmptyStateRow>
        )}
      </tbody>
      <tbody>
        <HeadingRow>
          <TranslatedText fallback="PRN medication" stringId="medication.mar.prnMedication.label" />
        </HeadingRow>

        {isLoadingMedications ? (
          <EmptyStateRow>
            <TranslatedText stringId="general.table.loading" fallback="Loading…" />
          </EmptyStateRow>
        ) : prnMedications.length ? (
          prnMedications.map(medication => (
            <MarTableRow
              key={medication?.id}
              medication={medication}
              selectedDate={selectedDate}
              popperAnchorEl={popperAnchorEl}
              onPopperAnchorElChange={setPopperAnchorEl}
            />
          ))
        ) : (
          <EmptyStateRow>
            <TranslatedText
              fallback="No PRN medication to display"
              stringId="medication.mar.noPrnMedication.label"
            />
          </EmptyStateRow>
        )}
      </tbody>
    </Table>
  );
};
