import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { toDateString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../api/queries';
import { Table } from '../Table';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { formatShortest, formatTime } from '../DateDisplay';
import useOverflow from '../../hooks/useOverflow';
import { TableTooltip } from '../Table/TableTooltip';
import { MenuButton } from '../MenuButton';
import { CancelLocationBookingModal } from '../Appointments/CancelModal/CancelLocationBookingModal';

const TableTitle = styled(Typography)`
  font-size: 16px;
  font-weight: 500;
  padding: 15px 0px;
  border-bottom: 1px solid ${Colors.outline};
`;

const StyledTable = styled(Table)`
  padding: 0 20px;
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px;
    padding-bottom: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 11px;
    padding-right: 11px;
    &:first-child {
      padding-left: 0px;
    }
  }
  .MuiTableCell-body {
    padding: 11px;
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
        left: 26px;
      }
      > div > div {
        overflow: visible;
      }
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${props => (props.onClickRow ? Colors.veryLightBlue : '')};
    }
  }
`;

const LowerCaseText = styled.span`
  text-transform: lowercase;
`;

const Container = styled.div`
  margin: 0 30px 30px 30px;
`;

const getFormattedTime = time => {
  return formatTime(time).replace(' ', '');
};

const getDate = ({ startTime, endTime }) => {
  const startDate = toDateString(startTime);
  const endDate = toDateString(endTime);
  let dateTimeString;

  if (startDate === endDate) {
    dateTimeString = `${formatShortest(startTime)} ${getFormattedTime(
      startTime,
    )} - ${getFormattedTime(endTime)}`;
  } else {
    dateTimeString = `${formatShortest(startTime)} - ${formatShortest(endTime)}`;
  }
  return <LowerCaseText>{dateTimeString}</LowerCaseText>;
};

const CustomCellContainer = styled(Box)`
  white-space: nowrap;
`;

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

export const LocationBookingsTable = ({ patient }) => {
  const appointments =
    useAppointmentsQuery({
      locationId: '',
      all: true,
      patientId: patient?.id,
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
    history.push(`/appointments/locations?appointmentId=${id}&date=${toDateString(startTime)}`);
  }
  
  const COLUMNS = [
    {
      key: 'date',
      title: <TranslatedText stringId="patient.bookings.table.column.date" fallback="Date" />,
      maxWidth: 200,
      accessor: ({ startTime, endTime }) => getDate({ startTime, endTime }),
    },
    {
      key: 'location.name',
      title: <TranslatedText stringId="patient.bookings.table.column.area" fallback="Area" />,
      //accessor: ({ location }) => 'AGCFJ - Adult General ClinicAGCFJ - Adult General ClinicAGCFJ - Adult General ClinicAGCFJ - Adult General ClinicAGCFJ - Adult General ClinicAGCFJ - Adult General Clinic',
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={190} />,
    },
    {
      key: 'location.locationGroup.name',
      title: <TranslatedText stringId="patient.bookings.table.column.location" fallback="Location" />,
      sortable: false,
    },
    {
      key: 'bookingType.name',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.bookingType"
          fallback="Booking type"
        />
      ),
    },
    {
      key: '',
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => <div onMouseEnter={() => setSelectedAppointment(data)}>
        <MenuButton actions={actions} />
      </div>,
    },
  ];

  return (
    <Container>
      <StyledTable
        data={appointments}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText stringId="patient.bookings.table.noData" fallback="No invoices found" />
        }
        allowExport={false}
        TableHeader={
          <TableTitle>
            <TranslatedText stringId="patient.bookings.table.title" fallback="Location bookings" />
          </TableTitle>
        }
        onClickRow={handleRowClick}
      />
      <CancelLocationBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)} 
      />
    </Container>
  );
};
