import { Box } from '@material-ui/core';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import React from 'react';
import styled from 'styled-components';
import { isSameDay, parseISO } from 'date-fns';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { useLocationBookingsQuery } from '../../api/queries';
import { Colors } from '../../constants';
import { LimitedLinesCell } from '../FormattedTableCell';
import { Modal } from '../Modal';
import { Table } from '../Table';
import { useTableSorting } from '../Table/useTableSorting';
import { DateTimeRangeDisplay } from '@tamanu/ui-components';
import { ThemedTooltip } from '../Tooltip';
import { TranslatedText } from '../Translation';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: 922px;
    overflow-y: visible;
    div:nth-child(2) {
      overflow: visible;
    }
  }
  h2 {
    font-size: 18px;
    margin: -8px 0px;
  }
  .MuiDialogTitle-root {
    border-bottom: none;
    .MuiIconButton-root {
      position: absolute;
      top: 2px;
      right: -1px;
      svg {
        font-size: 24px;
      }
    }
  }
  .MuiDialogActions-root {
    padding: 0px;
  }
`;

const StyledTable = styled(Table)`
  border: 0px solid white;
  border-radius: 0px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 18px;
  max-height: calc(100vh - 128.8px);
  box-shadow: none;
  .MuiTableHead-root {
    position: sticky;
    top: 0;
  }
  .MuiTableCell-head {
    border-top: 1px solid ${Colors.outline};
    background-color: ${Colors.white};
    padding: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    &:last-child {
      padding-right: 30px;
    }
    &:first-child {
      padding-left: 30px;
    }
  }
  .MuiTableCell-body {
    border-bottom: none;
    padding: 12px 8px 0 8px;
    &:last-child {
      padding-right: 30px;
    }
    &:first-child {
      position: relative;
      padding-left: 30px;
    }
  }
  .MuiTableRow-root {
    &:last-child {
      td {
        border-bottom: none;
      }
    }
  }
`;

const Container = styled.div`
  margin: -18px -32px;
`;

const DateText = styled.div`
  text-transform: lowercase;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusBadge = styled.div`
  width: 74px;
  height: 26px;
  border-radius: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  color: ${p => APPOINTMENT_STATUS_COLORS[p.$status]};
  background-color: ${p => APPOINTMENT_STATUS_COLORS[p.$status]}1a;
`;

const OvernightIcon = styled.span`
  position: absolute;
  top: 17px;
  left: 146px;
  color: ${Colors.primary};
`;

const DateCell = ({ startTime, endTime }) => {
  const isOvernight = !isSameDay(parseISO(startTime), parseISO(endTime));

  return (
    <ThemedTooltip
      title={
        <Box style={{ textTransform: 'lowercase', fontWeight: 400 }} data-testid="box-q74p">
          <DateTimeRangeDisplay 
            start={startTime} 
            end={endTime} 
            showWeekday={false}
            dateFormat="shortest"
          />
        </Box>
      }
      data-testid="themedtooltip-euoy"
    >
      <DateText data-testid="datetext-z14b">
        <DateTimeRangeDisplay 
          start={startTime} 
          end={endTime} 
          showWeekday={false}
          dateFormat="shortest"
        />
        {isOvernight && (
          <OvernightIcon data-testid="overnighticon-2qtt">
            <Brightness2Icon fontSize="inherit" data-testid="brightness2icon-gxv2" />
          </OvernightIcon>
        )}
      </DateText>
    </ThemedTooltip>
  );
};

const getStatus = ({ status }) => (
  <StatusBadge $status={status} data-testid="statusbadge-qn43">
    {status}
  </StatusBadge>
);

const COLUMNS = [
  {
    key: 'startTime',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.date"
        fallback="Date"
        data-testid="translatedtext-okjz"
      />
    ),
    accessor: DateCell,
  },
  {
    key: 'bookingArea',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.area"
        fallback="Area"
        data-testid="translatedtext-a21s"
      />
    ),
    accessor: ({ location }) => location?.locationGroup?.name,
    CellComponent: props => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-1mrf" />
    ),
  },
  {
    key: 'location',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.location"
        fallback="Location"
        data-testid="translatedtext-5h9k"
      />
    ),
    accessor: ({ location }) => location?.name || '-',
    sortable: false,
    CellComponent: props => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-bdup" />
    ),
  },
  {
    key: 'clinician',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.clinician"
        fallback="Clinician"
        data-testid="translatedtext-oqsz"
      />
    ),
    accessor: ({ clinician }) => clinician?.displayName || '-',
    CellComponent: props => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-f99y" />
    ),
  },
  {
    key: 'bookingType',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.type"
        fallback="Booking type"
        data-testid="translatedtext-fan7"
      />
    ),
    accessor: ({ bookingType }) => bookingType?.name,
    CellComponent: props => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-hk2s" />
    ),
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.status"
        fallback="Status"
        data-testid="translatedtext-4wq8"
      />
    ),
    accessor: getStatus,
  },
];

export const PastBookingsModal = ({ onClose, patient }) => {
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'desc',
  });

  const { data, isLoading } = useLocationBookingsQuery(
    {
      all: true,
      patientId: patient?.id,
      before: getCurrentDateTimeString(),
      after: '-infinity',
      orderBy,
      order,
    },
    { keepPreviousData: true, refetchOnMount: true },
  );
  const bookings = data?.data ?? [];

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="bookings.modal.pastBookings.title"
          fallback="Past bookings"
          data-testid="translatedtext-q5v2"
        />
      }
      open
      onClose={onClose}
      width="lg"
      data-testid="styledmodal-e8gv"
    >
      <Container data-testid="container-nscl">
        <StyledTable
          isLoading={isLoading}
          data={bookings}
          columns={COLUMNS}
          order={order}
          orderBy={orderBy}
          onChangeOrderBy={onChangeOrderBy}
          data-testid="styledtable-sdrx"
        />
      </Container>
    </StyledModal>
  );
};
