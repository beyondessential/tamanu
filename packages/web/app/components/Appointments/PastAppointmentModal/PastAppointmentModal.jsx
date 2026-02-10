import React from 'react';
import styled from 'styled-components';

import { DateDisplay, TimeDisplay, useDateTimeFormat } from '@tamanu/ui-components';

import { useOutpatientAppointmentsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { LimitedLinesCell } from '../../FormattedTableCell';
import { Modal } from '../../Modal';
import { Table } from '../../Table';
import { useTableSorting } from '../../Table/useTableSorting';
import { TranslatedText } from '../../Translation';
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
  color: ${(p) => APPOINTMENT_STATUS_COLORS[p.$status]};
  background-color: ${(p) => APPOINTMENT_STATUS_COLORS[p.$status]}1a;
`;

const getDate = ({ startTime }) => (
  <LowercaseText data-testid="lowercasetext-gcnv">
    <DateDisplay date={startTime} format="shortest" /> <TimeDisplay date={startTime} noTooltip />
  </LowercaseText>
);

const getStatus = ({ status }) => (
  <StatusBadge $status={status} data-testid="statusbadge-h8hq">
    {status}
  </StatusBadge>
);

const COLUMNS = [
  {
    key: 'startTime',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.date"
        fallback="Date"
        data-testid="translatedtext-ii8d"
      />
    ),
    accessor: getDate,
    CellComponent: (props) => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-pvv1" />
    ),
  },
  {
    key: 'outpatientAppointmentArea',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.area"
        fallback="Area"
        data-testid="translatedtext-lqeo"
      />
    ),
    accessor: ({ locationGroup }) => locationGroup?.name,
    CellComponent: (props) => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-1631" />
    ),
  },
  {
    key: 'clinician',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.clinician"
        fallback="Clinician"
        data-testid="translatedtext-tnkx"
      />
    ),
    accessor: ({ clinician }) => clinician?.displayName || '-',
    CellComponent: (props) => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-ye2y" />
    ),
  },
  {
    key: 'appointmentType',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.type"
        fallback="Appt type"
        data-testid="translatedtext-9knl"
      />
    ),
    accessor: ({ appointmentType }) => appointmentType?.name,
    CellComponent: (props) => (
      <LimitedLinesCell {...props} isOneLine data-testid="limitedlinescell-5zku" />
    ),
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="pastAppointment.modal.table.column.status"
        fallback="Status"
        data-testid="translatedtext-9qt9"
      />
    ),
    accessor: getStatus,
  },
];

export const PastAppointmentModal = ({ open, onClose, patient }) => {
  const { getCurrentDateTime } = useDateTimeFormat();
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'desc',
  });

  const { data, isLoading } = useOutpatientAppointmentsQuery(
    {
      all: true,
      patientId: patient?.id,
      before: getCurrentDateTime(),
      after: '-infinity',
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
          data-testid="translatedtext-oozd"
        />
      }
      open={open}
      onClose={onClose}
      width="lg"
      data-testid="styledmodal-897f"
    >
      <Container data-testid="container-68bq">
        <StyledTable
          isLoading={isLoading}
          data={appointments}
          columns={COLUMNS}
          order={order}
          orderBy={orderBy}
          onChangeOrderBy={onChangeOrderBy}
          data-testid="styledtable-ltf5"
        />
      </Container>
    </StyledModal>
  );
};
