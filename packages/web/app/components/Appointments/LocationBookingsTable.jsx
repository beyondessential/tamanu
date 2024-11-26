import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { toDateString } from '@tamanu/shared/utils/dateTime';
import Brightness2Icon from '@material-ui/icons/Brightness2';

import { useAppointmentsQuery } from '../../api/queries';
import { Table } from '../Table';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { formatShortest, formatTime } from '../DateDisplay';
import useOverflow from '../../hooks/useOverflow';
import { TableTooltip } from '../Table/TableTooltip';
import { MenuButton } from '../MenuButton';
import { CancelLocationBookingModal } from './CancelModal/CancelLocationBookingModal';
import { useTableSorting } from '../Table/useTableSorting';
import { PastBookingsModal } from './PastBookingsModal';

const TableTitleContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
  line-height: 1.5;
  height: 50px;
`;

const ViewPastBookingsButton = styled(Box)`
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
`;

const OvernightIcon = styled(Brightness2Icon)`
  color: ${Colors.primary};
  font-size: 12px;
`;

const StyledTable = styled(Table)`
  max-height: 186px;
  padding: 0 20px;
  .MuiTableHead-root {
    tr {
      position: sticky;
      top: 50px;
      background-color: ${Colors.white};
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
      width: 26%;
    }
    &:nth-child(2) {
      width: 34%;
    }
    &:nth-child(3) {
      width: 23%;
    }
    &:nth-child(4) {
      width: 17%;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${props => (props.onClickRow ? Colors.veryLightBlue : '')};
    }
  }
`;

const DateText = styled.div`
  text-transform: lowercase;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NoDataContainer = styled.div`
  padding: 0 20px;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
`;

const TableHeader = ({ title }) => (
  <TableTitleContainer>
    <Box component={'span'} fontSize="16px" fontWeight={500}>
      {title}
    </Box>
    <ViewPastBookingsButton component={'span'}>
      <TranslatedText
        stringId="patient.bookings.table.viewPastBookings"
        fallback="View past bookings"
      />
    </ViewPastBookingsButton>
  </TableTitleContainer>
);

const getFormattedTime = time => {
  return formatTime(time).replace(' ', '');
};

const getDate = ({ startTime, endTime }) => {
  const startDate = toDateString(startTime);
  const endDate = toDateString(endTime);
  let dateTimeString;
  const isOvernight = startDate !== endDate;

  if (!isOvernight) {
    dateTimeString = `${formatShortest(startTime)} ${getFormattedTime(
      startTime,
    )} - ${getFormattedTime(endTime)}`;
  } else {
    dateTimeString = `${formatShortest(startTime)} - ${formatShortest(endTime)}`;
  }
  return (
    <DateText>
      <div>{dateTimeString}</div>
      {isOvernight && <OvernightIcon />}
    </DateText>
  );
};

const CustomCellContainer = styled(Box)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'asc',
  });

  const appointments =
    useAppointmentsQuery({
      locationId: '',
      all: true,
      patientId: patient?.id,
      orderBy,
      order,
    }).data?.data ?? [];

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);
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
  };

  const COLUMNS = [
    {
      key: 'startTime',
      title: <TranslatedText stringId="patient.bookings.table.column.date" fallback="Date" />,
      accessor: ({ startTime, endTime }) => getDate({ startTime, endTime }),
    },
    {
      key: 'bookingArea',
      title: <TranslatedText stringId="patient.bookings.table.column.area" fallback="Area" />,
      accessor: ({ location }) => location?.locationGroup?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={243} />,
    },
    {
      key: 'location',
      title: (
        <TranslatedText stringId="patient.bookings.table.column.location" fallback="Location" />
      ),
      accessor: ({ location }) => location?.name,
      sortable: false,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={158} />,
    },
    {
      key: 'bookingType',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.bookingType"
          fallback="Booking type"
        />
      ),
      accessor: ({ bookingType }) => bookingType?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={100} />,
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
              stringId="patient.bookings.table.noData"
              fallback="No location bookings"
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
                stringId="patient.bookings.table.title"
                fallback="Location bookings"
              />
            }
          />
        }
        onClickRow={handleRowClick}
        orderBy={orderBy}
        order={order}
        onChangeOrderBy={onChangeOrderBy}
      />
      <CancelLocationBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
      {isViewPastBookingsModalOpen && (
        <PastBookingsModal
          patient={patient}
          onClose={() => setIsViewPastBookingsModalOpen(false)}
        />
      )}
    </div>
  );
};
