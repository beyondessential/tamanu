import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString, toDateString } from '@tamanu/utils/dateTime';

import { Table } from '../Table';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { formatShortest, formatTime } from '../DateDisplay';
import useOverflow from '../../hooks/useOverflow';
import { TableTooltip } from '../Table/TableTooltip';
import { MenuButton } from '../MenuButton';
import { useTableSorting } from '../Table/useTableSorting';
import { Button } from '../Button';
import { CancelAppointmentModal } from './CancelModal/CancelAppointmentModal';
import { PastAppointmentModal } from './PastAppointmentModal/PastAppointmentModal';
import { useOutpatientAppointmentsQuery } from '../../api/queries/useAppointmentsQuery';
import { useAuth } from '../../contexts/Auth';

const TableTitleContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 6px 4px 10px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
  line-height: 1.5;
  height: 50px;
`;

const StyledTable = styled(Table)`
  box-shadow: none;
  max-height: 186px;
  padding: 0 10px;
  .MuiTableHead-root {
    background-color: ${Colors.white};
    tr {
      position: sticky;
      top: 50px;
      z-index: 1;
    }
  }
  .MuiTableCell-head {
    background-color: ${Colors.white};
    border-top: 1px solid ${Colors.outline};
    padding-top: 8px;
    padding-bottom: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 6px;
    padding-right: 6px;
    &:first-child {
      position: relative;
      padding-left: 10px;
      border-bottom: none;
      border-top: none;
      &:before {
        content: '';
        position: absolute;
        width: calc(100% - 10px);
        height: 1px;
        background-color: ${Colors.outline};
        bottom: 0;
        right: 0;
      }
      &:after {
        content: '';
        position: absolute;
        width: calc(100% - 10px);
        height: 1px;
        background-color: ${Colors.outline};
        top: 0;
        right: 0;
      }
    }
    &:last-child {
      position: relative;
      padding-right: 10px;
      border-bottom: none;
      border-top: none;
      &:before {
        content: '';
        position: absolute;
        width: calc(100% - 10px);
        height: 1px;
        background-color: ${Colors.outline};
        bottom: 0;
        left: 0;
      }
      &:after {
        content: '';
        position: absolute;
        width: calc(100% - 10px);
        height: 1px;
        background-color: ${Colors.outline};
        top: 0;
        left: 0;
      }
    }
  }
  .MuiTableCell-body {
    padding: 6px;
    padding-top: 2px;
    padding-bottom: 2px;
    &:first-child {
      position: relative;
      padding-left: 10px;
      border-radius: 5px 0 0 5px;
      border-bottom: none;
      &:before {
        content: '';
        position: absolute;
        width: 100%;
        height: 1px;
        background-color: ${Colors.outline};
        bottom: 0;
      }
    }
    > div > div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    &:last-child {
      border-radius: 0 5px 5px 0;
      width: 28px;
      > div > div {
        overflow: visible;
      }
      position: relative;
      border-bottom: none;
      &:before {
        content: '';
        position: absolute;
        width: calc(100% - 10px);
        height: 1px;
        background-color: ${Colors.outline};
        bottom: 0;
        left: 0;
      }
    }
    &:nth-child(1) {
      width: 21%;
    }
    &:nth-child(2) {
      width: 35%;
    }
    &:nth-child(3) {
      width: 20%;
    }
    &:nth-child(4) {
      width: 24%;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover:not(:has(.menu-container:hover)) {
      background-color: ${props => (props.onClickRow ? Colors.veryLightBlue : '')};
    }
  }
`;

const ViewPastBookingsButton = styled(Box)`
  font-size: 11px;
  font-weight: 400;
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: ${Colors.primary};
    font-weight: 500;
  }
`;

const CustomCellContainer = styled(Box)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const DateText = styled.div`
  text-transform: lowercase;
  min-width: 118px;
`;

const NoDataContainer = styled.div`
  padding: 0 10px 0 10px;
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
`;

const StyledMenuButton = styled(MenuButton)`
  .MuiIconButton-root {
    &:hover {
      background-color: transparent;
    }
  }
`;

const MenuContainer = styled.div`
  position: relative;
  left: 11px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 50%;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const getDate = ({ startTime }) => (
  <DateText>{`${formatShortest(startTime)} ${formatTime(startTime).replace(' ', '')}`}</DateText>
);

const CustomCellComponent = ({ value, $maxWidth }) => {
  const [ref, isOverflowing] = useOverflow();
  return (
    <CustomCellContainer ref={ref} maxWidth={$maxWidth}>
      {!isOverflowing ? (
        value
      ) : (
        <TableTooltip title={value}>
          <div>{value}</div>
        </TableTooltip>
      )}
    </CustomCellContainer>
  );
};

const TableHeader = ({ title, patient }) => {
  const { ability } = useAuth();
  const history = useHistory();
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);

  const canCreateAppointment = ability.can('create', 'Appointment');
  return (
    <TableTitleContainer>
      <Box component={'span'} fontSize="16px" fontWeight={500}>
        {title}
      </Box>
      <ActionRow>
        <ViewPastBookingsButton
          component={'span'}
          onClick={() => setIsViewPastBookingsModalOpen(true)}
          mr="6px"
        >
          <TranslatedText
            stringId="patient.appointments.table.viewPastAppointments"
            fallback="View past appointments"
          />
        </ViewPastBookingsButton>
        {canCreateAppointment && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => history.push(`/appointments/outpatients?patientId=${patient?.id}`)}
          >
            <TranslatedText
              stringId="patient.appointments.table.bookAppointment"
              fallback="+ Book appointment"
            />
          </Button>
        )}
      </ActionRow>
      {isViewPastBookingsModalOpen && (
        <PastAppointmentModal
          open={true}
          onClose={() => setIsViewPastBookingsModalOpen(false)}
          patient={patient}
        />
      )}
    </TableTitleContainer>
  );
};

export const OutpatientAppointmentsTable = ({ patient }) => {
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'asc',
  });

  const { data, isLoading } = useOutpatientAppointmentsQuery(
    {
      all: true,
      patientId: patient?.id,
      orderBy,
      order,
      after: getCurrentDateTimeString(),
    },
    { keepPreviousData: true, refetchOnMount: true },
  );
  const appointments = data?.data ?? [];

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const history = useHistory();

  const actions = [
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
      action: () => setIsCancelModalOpen(true),
    },
  ];

  const handleRowClick = (_, data) => {
    const { id, startTime } = data;
    history.push(`/appointments/outpatients?appointmentId=${id}&date=${toDateString(startTime)}`);
  };

  const COLUMNS = [
    {
      key: 'startTime',
      title: <TranslatedText stringId="patient.appointments.table.column.date" fallback="Date" />,
      accessor: getDate,
    },
    {
      key: 'outpatientAppointmentArea',
      title: <TranslatedText stringId="patient.appointments.table.column.area" fallback="Area" />,
      accessor: ({ locationGroup }) => locationGroup?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={248} />,
    },
    {
      key: 'clinician',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.clinician"
          fallback="Clinician"
        />
      ),
      accessor: ({ clinician }) => clinician?.displayName || '-',
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={139} />,
    },
    {
      key: 'appointmentType',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.appointmentType"
          fallback="Appointment type"
        />
      ),
      accessor: ({ appointmentType }) => appointmentType?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={155} />,
    },
    {
      key: '',
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => (
        <MenuContainer className="menu-container" onMouseEnter={() => setSelectedAppointment(data)}>
          <StyledMenuButton actions={actions} />
        </MenuContainer>
      ),
    },
  ];

  if (!appointments.length && !isLoading) {
    return (
      <NoDataContainer>
        <TableHeader
          title={
            <TranslatedText
              stringId="patient.appointments.table.noData"
              fallback="No outpatient appointments"
            />
          }
          patient={patient}
        />
      </NoDataContainer>
    );
  }

  return (
    <div>
      <StyledTable
        isLoading={isLoading}
        data={appointments}
        columns={COLUMNS}
        allowExport={false}
        TableHeader={
          <TableHeader
            title={
              <TranslatedText
                stringId="patient.appointments.table.title"
                fallback="Outpatient appointments"
              />
            }
            patient={patient}
          />
        }
        onClickRow={handleRowClick}
        orderBy={orderBy}
        order={order}
        onChangeOrderBy={onChangeOrderBy}
      />
      <CancelAppointmentModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
