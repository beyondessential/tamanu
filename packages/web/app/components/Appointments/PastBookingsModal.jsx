import React, { useMemo } from 'react';
import styled from 'styled-components';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import { Box } from '@material-ui/core';

import { Modal } from '../Modal';
import { Table } from '../Table';
import { TranslatedText } from '../Translation';
import { useAppointmentsQuery } from '../../api/queries';
import { formatShortest, formatTime } from '../DateDisplay';
import { Colors } from '../../constants';
import { useTableSorting } from '../Table/useTableSorting';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: 922px;
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
  max-height: 547px;
  .MuiTableHead-root {
    position: sticky;
    top: 0;
  }
  .MuiTableCell-head {
    border-top: 1px solid ${Colors.outline};
    background-color: ${Colors.white};
    padding-top: 8px;
    padding-bottom: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 30px;
    }
    &:first-child {
      padding-left: 30px;
    }
  }
  .MuiTableCell-body {
    padding: 11px;
    &:last-child {
      padding-right: 30px;
    }
    &:first-child {
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
  white-space: pre;
  display: flex;
  align-items: center;
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

const getDate = ({ startTime, endTime, overnight }) => {
  const formatShortestStartTime = formatShortest(startTime);
  const formatShortestEndTime = formatShortest(endTime);
  const formatTimeStartTime = formatTime(startTime).replace(' ', '');
  const formatTimeEndTime = formatTime(endTime).replace(' ', '');

  return (
    <DateText>
      {formatShortestStartTime === formatShortestEndTime
        ? `${formatShortestStartTime} ${formatTimeStartTime} - ${formatTimeEndTime}`
        : `${formatShortestStartTime} - ${formatShortestEndTime}`}
      {overnight && (
        <Box component={'span'} display={'flex'} color={Colors.primary} ml={0.5}>
          <Brightness2Icon fontSize="inherit" />
        </Box>
      )}
    </DateText>
  );
};

const getStatus = ({ status }) => <StatusBadge $status={status}>{status}</StatusBadge>;

const COLUMNS = [
  {
    key: 'startTime',
    title: (
      <TranslatedText stringId="bookings.modal.pastBookings.table.column.date" fallback="Date" />
    ),
    accessor: getDate,
  },
  {
    key: 'bookingArea',
    title: (
      <TranslatedText stringId="bookings.modal.pastBookings.table.column.area" fallback="Area" />
    ),
    accessor: ({ location }) => location?.locationGroup?.name,
  },
  {
    key: 'location',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.location"
        fallback="Location"
      />
    ),
    accessor: ({ location }) => location?.name || '-',
    sortable: false,
  },
  {
    key: 'clinician',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.clinician"
        fallback="Clinician"
      />
    ),
    accessor: ({ clinician }) => clinician?.displayName || '-',
  },
  {
    key: 'bookingType',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.type"
        fallback="Booking type"
      />
    ),
    accessor: ({ bookingType }) => bookingType?.name,
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="bookings.modal.pastBookings.table.column.status"
        fallback="Status"
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

  const beforeDate = useMemo(() => new Date().toISOString(), []);
  const bookings =
    useAppointmentsQuery(
      {
        all: true,
        patientId: patient?.id,
        before: beforeDate,
        after: '1970-01-01 00:00',
        orderBy,
        order,
        locationId: '',
        locationGroup: '',
      },
      { keepPreviousData: true, refetchOnMount: true },
    ).data?.data ?? [];

  return (
    <StyledModal
      title={
        <TranslatedText stringId="bookings.modal.pastBookings.title" fallback="Past bookings" />
      }
      open
      onClose={onClose}
      width="lg"
    >
      <Container>
        <StyledTable
          data={bookings}
          columns={COLUMNS}
          order={order}
          orderBy={orderBy}
          onChangeOrderBy={onChangeOrderBy}
        />
      </Container>
    </StyledModal>
  );
};
