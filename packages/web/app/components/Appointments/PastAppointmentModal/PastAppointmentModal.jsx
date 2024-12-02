import React, { useMemo } from 'react';
import styled from 'styled-components';

import { Modal } from '../../Modal';
import { Table } from '../../Table';
import { TranslatedText } from '../../Translation';
import { useOutpatientAppointmentsQuery } from '../../../api/queries';
import { formatShortest, formatTime } from '../../DateDisplay';
import { Colors } from '../../../constants';
import { useTableSorting } from '../../Table/useTableSorting';
import { APPOINTMENT_STATUS_COLORS } from '../appointmentStatusIndicators';

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
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:first-child {
        td {
          padding-top: 18px;
        }
      }
    }
  }
  .MuiTableCell-body {
    border-bottom: none;
    padding-top: 6px;
    padding-bottom: 6px;
    padding-left: 11px;
    padding-right: 11px;
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

const LowercaseText = styled.div`
  text-transform: lowercase;
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

const getDate = ({ startTime }) => (
  <LowercaseText>
    {`${formatShortest(startTime)} ${formatTime(startTime).replace(' ', '')}`}
  </LowercaseText>
);

const getStatus = ({ status }) => <StatusBadge $status={status}>{status}</StatusBadge>;

const COLUMNS = [
  {
    key: 'startTime',
    title: <TranslatedText stringId="pastAppointment.modal.table.column.date" fallback="Date" />,
    accessor: getDate,
  },
  {
    key: 'outpatientAppointmentArea',
    title: <TranslatedText stringId="pastAppointment.modal.table.column.area" fallback="Area" />,
    accessor: ({ locationGroup }) => locationGroup?.name,
  },
  {
    key: 'clinician',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.clinician"
        fallback="Clinician"
      />
    ),
    accessor: ({ clinician }) => clinician?.displayName || '-',
  },
  {
    key: 'appointmentType',
    title: (
      <TranslatedText stringId="pastAppointment.modal.table.column.type" fallback="Appt type" />
    ),
    accessor: ({ appointmentType }) => appointmentType?.name,
  },
  {
    key: 'status',
    title: (
      <TranslatedText stringId="pastAppointment.modal.table.column.status" fallback="Status" />
    ),
    accessor: getStatus,
  },
];

export const PastAppointmentModal = ({ open, onClose, patient }) => {
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'desc',
  });
  const beforeDate = useMemo(() => new Date().toISOString(), []);
  const { data, isLoading } = useOutpatientAppointmentsQuery(
    {
      all: true,
      patientId: patient?.id,
      before: beforeDate,
      after: '1970-01-01 00:00',
      orderBy,
      order,
    },
    { keepPreviousData: true, refetchOnMount: true },
  );
  const appointments = data?.data ?? [];

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="appointment.modal.pastAppointments.title"
          fallback="Past appointments"
        />
      }
      open={open}
      onClose={onClose}
      width="lg"
    >
      <Container>
        <StyledTable
          isLoading={isLoading}
          data={appointments}
          columns={COLUMNS}
          order={order}
          orderBy={orderBy}
          onChangeOrderBy={onChangeOrderBy}
        />
      </Container>
    </StyledModal>
  );
};
