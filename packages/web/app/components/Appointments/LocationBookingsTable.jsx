import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getCurrentDateTimeString,
  toDateString,
  formatShortest,
  formatTime,
} from '@tamanu/utils/dateTime';
import Brightness2Icon from '@material-ui/icons/Brightness2';

import { useLocationBookingsQuery } from '../../api/queries';
import { Table } from '../Table';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import useOverflow from '../../hooks/useOverflow';
import { TableTooltip } from '../Table/TableTooltip';
import { MenuButton } from '../MenuButton';
import { CancelLocationBookingModal } from './CancelModal/CancelLocationBookingModal';
import { useTableSorting } from '../Table/useTableSorting';
import { PastBookingsModal } from './PastBookingsModal';
import { useAuth } from '../../contexts/Auth';

const TableTitleContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 12px 15px 10px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
  line-height: 1.5;
  height: 50px;
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

const OvernightIcon = styled(Brightness2Icon)`
  color: ${Colors.primary};
  font-size: 12px;
`;

const StyledTable = styled(Table)`
  box-shadow: none;
  max-height: 186px;
  padding: 0 10px;
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
    padding: 11px 6px;
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
      padding-top: 0;
      padding-bottom: 0;
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
    &:hover:not(:has(.menu-container:hover)) {
      background-color: ${props => (props.onClickRow ? Colors.veryLightBlue : '')};
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:last-child {
        .MuiTableCell-body {
          border-bottom: none;
          &:before {
            height: 0;
          }
        }
      }
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
  padding: 0 10px 0 10px;
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
`;

const CustomCellContainer = styled(Box)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const StyledMenuButton = styled(MenuButton)`
  .MuiIconButton-root {
    background-color: transparent;
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

const TableHeader = ({ title, openPastBookingsModal }) => (
  <TableTitleContainer>
    <Box component={'span'} fontSize="16px" fontWeight={500}>
      {title}
    </Box>
    <ViewPastBookingsButton component={'span'} onClick={openPastBookingsModal}>
      <TranslatedText
        stringId="patient.bookings.table.viewPastBookings"
        fallback="View past bookings"
        data-test-id='translatedtext-65em' />
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
  const { ability } = useAuth();
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'asc',
  });

  const allAppointments =
    useLocationBookingsQuery({
      all: true,
      patientId: patient?.id,
      after: '1970-01-01 00:00',
    }).data?.data ?? [];

  const { data, isLoading } = useLocationBookingsQuery(
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
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const history = useHistory();

  const actions = [
    {
      label: <TranslatedText
        stringId="general.action.cancel"
        fallback="Cancel"
        data-test-id='translatedtext-rh9g' />,
      action: () => setIsCancelModalOpen(true),
    },
  ];

  const handleRowClick = (_, data) => {
    const { id, startTime } = data;
    history.push(`/appointments/locations?appointmentId=${id}&date=${toDateString(startTime)}`);
  };

  const canWriteAppointment = ability.can('write', 'Appointment');

  const COLUMNS = [
    {
      key: 'startTime',
      title: <TranslatedText
        stringId="patient.bookings.table.column.date"
        fallback="Date"
        data-test-id='translatedtext-pjbk' />,
      accessor: ({ startTime, endTime }) => getDate({ startTime, endTime }),
    },
    {
      key: 'bookingArea',
      title: <TranslatedText
        stringId="patient.bookings.table.column.area"
        fallback="Area"
        data-test-id='translatedtext-nks6' />,
      accessor: ({ location }) => location?.locationGroup?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={243} />,
    },
    {
      key: 'location',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.location"
          fallback="Location"
          data-test-id='translatedtext-6tc7' />
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
          data-test-id='translatedtext-arzq' />
      ),
      accessor: ({ bookingType }) => bookingType?.name,
      CellComponent: ({ value }) => <CustomCellComponent value={value} $maxWidth={100} />,
    },
    ...(canWriteAppointment
      ? [
          {
            key: '',
            title: '',
            dontCallRowInput: true,
            sortable: false,
            CellComponent: ({ data }) => (
              <MenuContainer
                className="menu-container"
                onMouseEnter={() => setSelectedAppointment(data)}
              >
                <StyledMenuButton actions={actions} data-test-id='styledmenubutton-qu47' />
              </MenuContainer>
            ),
          },
        ]
      : []),
  ];

  if (!allAppointments.length) {
    return null;
  }

  if (!appointments.length && !isLoading) {
    return (
      <NoDataContainer>
        <TableHeader
          title={
            <TranslatedText
              stringId="patient.bookings.table.noData"
              fallback="No location bookings"
              data-test-id='translatedtext-4b74' />
          }
          openPastBookingsModal={() => setIsViewPastBookingsModalOpen(true)}
        />
        {isViewPastBookingsModalOpen && (
          <PastBookingsModal
            patient={patient}
            onClose={() => setIsViewPastBookingsModalOpen(false)}
          />
        )}
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
                stringId="patient.bookings.table.title"
                fallback="Location bookings"
                data-test-id='translatedtext-yy77' />
            }
            openPastBookingsModal={() => setIsViewPastBookingsModalOpen(true)}
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
