import Skeleton from '@mui/material/Skeleton';
import { partition } from 'lodash';
import React, { useState } from 'react';
import styled from 'styled-components';

import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';
import { toDateString } from '@tamanu/utils/dateTime';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { useEncounter } from '../../../contexts/Encounter';
import { MarTableRow } from './MarTableRow';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';

const Table = styled.table`
  --mar-border: 1px solid ${p => p.theme.palette.divider};
  --mar-current-time-border: ${p => p.theme.palette.primary.main};
  border-block-end: var(--mar-border);
  border-collapse: collapse;
  font-size: 12px;
  inline-size: 100%;
  position: relative;

  & tr {
    border-block-start: var(--mar-border);
  }

  & :is(th, td) {
    padding: 10px;
    border-inline-start: var(--mar-border);
    &:last-child {
      border-block-end: var(--mar-border);
      border-inline-end: var(--mar-border);
    }
  }

  & :is(th, td)[aria-current='time'] {
    border-inline: 1px solid var(--mar-current-time-border);
  }
  & thead tr:first-of-type :is(th, td)[aria-current='time'] {
    border-block-start: 1px solid var(--mar-current-time-border);
    color: ${p => p.theme.palette.primary.main};
  }
  & tbody:last-of-type tr:last-of-type :is(th, td)[aria-current='time'] {
    border-block-end: 1px solid var(--mar-current-time-border);
  }
`;

const TableHead = styled.thead.attrs({ role: 'rowgroup' })`
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
  line-height: 1.25;
  min-block-size: 2lh;
  rotate: 0.5turn;
  text-orientation: sideways;
  writing-mode: vertical-rl;
`;

const TimeSlotLabel = styled.div`
  color: ${p => p.theme.palette.text.primary};
  font-weight: 500;
  text-transform: capitalize;
`;

function EmptyStateRow({ children, selectedDate, style, ...props }) {
  return (
    <tr {...props} style={{ ...style, fontWeight: '500' }}>
      <td>{children}</td>
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime, endTime }) => (
        <BorderlessCell
          key={startTime}
          startTime={startTime}
          endTime={endTime}
          selectedDate={selectedDate}
        />
      ))}
    </tr>
  );
}

function RowSkeleton({ selectedDate }) {
  return Array.from({ length: 2 }).map((_, index) => (
    <tr key={index}>
      <th>
        <Skeleton width="min(40ch, 100%)" />
        <Skeleton width="min(25ch, 100%)" />
      </th>
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime, endTime }) => (
        <TableCell
          key={startTime}
          startTime={startTime}
          endTime={endTime}
          selectedDate={selectedDate}
          style={{ padding: 0 }}
        >
          <Skeleton variant="rectangular" height="calc(2lh + 20px)" />
        </TableCell>
      ))}
    </tr>
  ));
}

const HeadingTableCell = styled.th.attrs({ scope: 'rowgroup' })`
  color: ${p => p.theme.palette.text.tertiary};
  font-size: 14px;
  font-weight: 500;
  position: sticky;
  z-index: 5;
`;

function TableCell({ startTime, endTime, selectedDate, ...props }) {
  const current = useIsCurrentTimeSlot({ startTime, endTime, selectedDate });
  return <td aria-current={current ? 'time' : undefined} aria-hidden {...props} />;
}

const BorderlessCell = styled(TableCell)`
  &:not([aria-current='time']) {
    border-inline: none;
  }
`;

function HeadingRow({ children, selectedDate, ...props }) {
  return (
    <tr {...props}>
      <HeadingTableCell as="th">{children}</HeadingTableCell>
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime, endTime }) => (
        <BorderlessCell
          key={startTime}
          startTime={startTime}
          endTime={endTime}
          selectedDate={selectedDate}
        />
      ))}
    </tr>
  );
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
      <TableHead>
        <tr>
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
        </tr>
      </TableHead>
      <tbody aria-busy={isLoadingMedications}>
        <HeadingRow selectedDate={selectedDate}>
          <TranslatedText
            fallback="Scheduled medication"
            stringId="medication.mar.scheduledMedication.label"
          />
        </HeadingRow>
        {isLoadingMedications ? (
          <RowSkeleton selectedDate={selectedDate} />
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
          <EmptyStateRow selectedDate={selectedDate}>
            <TranslatedText
              fallback="No scheduled medication to display"
              stringId="medication.mar.noScheduledMedication.label"
            />
          </EmptyStateRow>
        )}
      </tbody>
      <tbody aria-busy={isLoadingMedications}>
        <HeadingRow selectedDate={selectedDate}>
          <TranslatedText fallback="PRN medication" stringId="medication.mar.prnMedication.label" />
        </HeadingRow>

        {isLoadingMedications ? (
          <RowSkeleton selectedDate={selectedDate} />
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
