import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { toDateString, formatShortest, formatTime } from '@tamanu/utils/dateTime';
import Brightness2Icon from '@material-ui/icons/Brightness2';

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
import {
  useHasPastLocationBookingsQuery,
  useUpcomingLocationBookingsQuery,
} from '../../api/queries/useAppointmentsQuery';

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
  <TableTitleContainer data-testid="tabletitlecontainer-hxpa">
    <Box component={'span'} fontSize="16px" fontWeight={500} data-testid="box-y2q5">
      {title}
    </Box>
    <ViewPastBookingsButton
      component={'span'}
      onClick={openPastBookingsModal}
      data-testid="viewpastbookingsbutton-ye4j"
    >
      <TranslatedText
        stringId="patient.bookings.table.viewPastBookings"
        fallback="View past bookings"
        data-testid="translatedtext-cked"
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
    <DateText data-testid="datetext-jp36">
      <div>{dateTimeString}</div>
      {isOvernight && <OvernightIcon data-testid="overnighticon-qh8z" />}
    </DateText>
  );
};

const CustomCellComponent = ({ value, $maxWidth }) => {
  const [ref, isOverflowing] = useOverflow();
  return (
    <CustomCellContainer ref={ref} maxWidth={$maxWidth} data-testid="customcellcontainer-13tg">
      {!isOverflowing ? (
        value
      ) : (
        <TableTooltip title={value} data-testid="tabletooltip-g9dp">
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

  // Query to check if there are past location bookings
  const hasPastBookings = useHasPastLocationBookingsQuery(patient?.id);

  // Query for future bookings
  const {
    data: upcomingBookings = [],
    isLoading: isLoadingUpcomingBookings,
  } = useUpcomingLocationBookingsQuery(
    patient?.id,
    { orderBy, order },
    { keepPreviousData: true, refetchOnMount: true },
  );

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const navigate = useNavigate();

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-testid="translatedtext-bq2v"
        />
      ),
      action: () => setIsCancelModalOpen(true),
    },
  ];

  const handleRowClick = (_, data) => {
    const { id, startTime } = data;
    navigate(`/appointments/locations?appointmentId=${id}&date=${toDateString(startTime)}`);
  };

  const canWriteAppointment = ability.can('write', 'Appointment');

  const COLUMNS = [
    {
      key: 'startTime',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.date"
          fallback="Date"
          data-testid="translatedtext-u5j4"
        />
      ),
      accessor: ({ startTime, endTime }) => getDate({ startTime, endTime }),
    },
    {
      key: 'bookingArea',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.area"
          fallback="Area"
          data-testid="translatedtext-jc2m"
        />
      ),
      accessor: ({ location }) => location?.locationGroup?.name,
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={243} data-testid="customcellcomponent-7qqa" />
      ),
    },
    {
      key: 'location',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.location"
          fallback="Location"
          data-testid="translatedtext-jjpp"
        />
      ),
      accessor: ({ location }) => location?.name,
      sortable: false,
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={158} data-testid="customcellcomponent-rxc7" />
      ),
    },
    {
      key: 'bookingType',
      title: (
        <TranslatedText
          stringId="patient.bookings.table.column.bookingType"
          fallback="Booking type"
          data-testid="translatedtext-1adp"
        />
      ),
      accessor: ({ bookingType }) => bookingType?.name,
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={100} data-testid="customcellcomponent-3p9q" />
      ),
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
                data-testid="menucontainer-32u9"
              >
                <StyledMenuButton actions={actions} data-testid="styledmenubutton-y69e" />
              </MenuContainer>
            ),
          },
        ]
      : []),
  ];

  const hasAnyBookings = hasPastBookings || upcomingBookings.length > 0;

  if (!hasAnyBookings) {
    return null;
  }

  if (!upcomingBookings.length && !isLoadingUpcomingBookings) {
    return (
      <NoDataContainer data-testid="nodatacontainer-t8nv">
        <TableHeader
          title={
            <TranslatedText
              stringId="patient.bookings.table.noData"
              fallback="No location bookings"
              data-testid="translatedtext-61nq"
            />
          }
          openPastBookingsModal={() => setIsViewPastBookingsModalOpen(true)}
          data-testid="tableheader-8w1t"
        />
        {isViewPastBookingsModalOpen && (
          <PastBookingsModal
            patient={patient}
            onClose={() => setIsViewPastBookingsModalOpen(false)}
            data-testid="pastbookingsmodal-tbm1"
          />
        )}
      </NoDataContainer>
    );
  }

  return (
    <div>
      <StyledTable
        isLoading={isLoadingUpcomingBookings}
        data={upcomingBookings}
        columns={COLUMNS}
        allowExport={false}
        TableHeader={
          <TableHeader
            title={
              <TranslatedText
                stringId="patient.bookings.table.title"
                fallback="Location bookings"
                data-testid="translatedtext-40uc"
              />
            }
            openPastBookingsModal={() => setIsViewPastBookingsModalOpen(true)}
            data-testid="tableheader-z0zh"
            hasPastBookings={hasPastBookings}
          />
        }
        onClickRow={handleRowClick}
        orderBy={orderBy}
        order={order}
        onChangeOrderBy={onChangeOrderBy}
        data-testid="styledtable-9ee7"
      />
      <CancelLocationBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        data-testid="cancellocationbookingmodal-3ewr"
      />
      {isViewPastBookingsModalOpen && (
        <PastBookingsModal
          patient={patient}
          onClose={() => setIsViewPastBookingsModalOpen(false)}
          data-testid="pastbookingsmodal-x4ug"
        />
      )}
    </div>
  );
};
