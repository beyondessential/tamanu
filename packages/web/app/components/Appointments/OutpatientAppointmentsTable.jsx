import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { toDateString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../api/queries';
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

const TableTitleContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 0px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
  line-height: 1.5;
  height: 50px;
`;

const StyledTable = styled(Table)`
  max-height: 186px;
  padding: 0 20px;
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
      padding-left: 0px;
    }
  }
  .MuiTableCell-body {
    padding: 6px;
    padding-top: 2px;
    padding-bottom: 2px;
    &:first-child {
      padding-left: 0px;
    }
    > div > div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    &:last-child {
      width: 28px;
      button {
        position: relative;
        left: 21px;
      }
      > div > div {
        overflow: visible;
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
    &:hover {
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

const LowercaseText = styled.div`
  text-transform: lowercase;
`;

const NoDataContainer = styled.div`
  padding: 0 20px;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
`;

const getDate = ({ startTime }) => (
  <LowercaseText>
    {`${formatShortest(startTime)} ${formatTime(startTime).replace(' ', '')}`}
  </LowercaseText>
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

const TableHeader = ({ title }) => {
  const history = useHistory();
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);
  return (
    <TableTitleContainer>
      <Box component={'span'} fontSize="16px" fontWeight={500}>
        {title}
      </Box>
      <div>
        <ViewPastBookingsButton
          component={'span'}
          onClick={() => setIsViewPastBookingsModalOpen(true)}
          mr={2}
        >
          <TranslatedText
            stringId="patient.appointments.table.viewPastAppointments"
            fallback="View past appointments"
          />
        </ViewPastBookingsButton>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => history.push('/appointments/outpatients?newAppointment=true')}
        >
          <TranslatedText
            stringId="patient.appointments.table.bookAppointment"
            fallback="+ Book appointment"
          />
        </Button>
      </div>
      {isViewPastBookingsModalOpen && (
        <PastAppointmentModal 
          open={true} 
          onClose={() => setIsViewPastBookingsModalOpen(false)}
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

  const appointments =
    useAppointmentsQuery({
      locationGroupId: '',
      all: true,
      patientId: patient?.id,
      orderBy,
      order,
    }).data?.data ?? [];

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
        <div onMouseEnter={() => setSelectedAppointment(data)}>
          <MenuButton actions={actions} />
        </div>
      ),
    },
  ];

  if (!appointments.length) {
    return (
      <NoDataContainer>
        <TableHeader
          title={
            <TranslatedText
              stringId="patient.appointments.table.noData"
              fallback="No outpatient appointments"
            />
          }
        />
      </NoDataContainer>
    );
  }

  return (
    <div>
      <StyledTable
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
