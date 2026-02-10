import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Button, DateDisplay, TimeDisplay } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { Table } from '../Table';
import { TranslatedText } from '../Translation';
import useOverflow from '../../hooks/useOverflow';
import { TableTooltip } from '../Table/TableTooltip';
import { MenuButton } from '../MenuButton';
import { useTableSorting } from '../Table/useTableSorting';
import { CancelAppointmentModal } from './CancelModal/CancelAppointmentModal';
import { PastAppointmentModal } from './PastAppointmentModal/PastAppointmentModal';
import {
  useHasPastOutpatientAppointmentsQuery,
  useUpcomingOutpatientAppointmentsQuery,
} from '../../api/queries/useAppointmentsQuery';
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
  <DateText data-testid="datetext-axl2">
    <DateDisplay date={startTime} format="shortest" /> <TimeDisplay date={startTime} noTooltip />
  </DateText>
);

const CustomCellComponent = ({ value, $maxWidth }) => {
  const [ref, isOverflowing] = useOverflow();
  return (
    <CustomCellContainer ref={ref} maxWidth={$maxWidth} data-testid="customcellcontainer-yqs8">
      {!isOverflowing ? (
        value
      ) : (
        <TableTooltip title={value} data-testid="tabletooltip-5q2m">
          <div>{value}</div>
        </TableTooltip>
      )}
    </CustomCellContainer>
  );
};

const TableHeader = ({ title, patient, hasPastAppointments }) => {
  const { ability } = useAuth();
  const navigate = useNavigate();
  const [isViewPastBookingsModalOpen, setIsViewPastBookingsModalOpen] = useState(false);

  const canCreateAppointment = ability.can('create', 'Appointment');
  return (
    <TableTitleContainer data-testid="tabletitlecontainer-nioe">
      <Box component={'span'} fontSize="16px" fontWeight={500} data-testid="box-1pwh">
        {title}
      </Box>
      <ActionRow data-testid="actionrow-1l1y">
        {hasPastAppointments && (
          <ViewPastBookingsButton
            component={'span'}
            onClick={() => setIsViewPastBookingsModalOpen(true)}
            mr="6px"
            data-testid="viewpastbookingsbutton-3n25"
          >
            <TranslatedText
              stringId="patient.appointments.table.viewPastAppointments"
              fallback="View past appointments"
              data-testid="translatedtext-vw2l"
            />
          </ViewPastBookingsButton>
        )}
        {canCreateAppointment && !patient?.dateOfDeath && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/appointments/outpatients?patientId=${patient?.id}`)}
            data-testid="button-q06c"
          >
            <TranslatedText
              stringId="patient.appointments.table.bookAppointment"
              fallback="+ Book appointment"
              data-testid="translatedtext-xzcy"
            />
          </Button>
        )}
      </ActionRow>
      {isViewPastBookingsModalOpen && (
        <PastAppointmentModal
          open={true}
          onClose={() => setIsViewPastBookingsModalOpen(false)}
          patient={patient}
          data-testid="pastappointmentmodal-2d8a"
        />
      )}
    </TableTitleContainer>
  );
};

export const OutpatientAppointmentsTable = ({ patient }) => {
  const { ability } = useAuth();
  const { orderBy, order, onChangeOrderBy } = useTableSorting({
    initialSortKey: 'startTime',
    initialSortDirection: 'asc',
  });

  // Query to check if there are past appointments
  const { data: hasPastAppointments } = useHasPastOutpatientAppointmentsQuery(patient?.id);

  const { data: upcomingAppointments = [], isLoading: isLoadingUpcomingAppointments } =
    useUpcomingOutpatientAppointmentsQuery(
      patient?.id,
      { orderBy, order },
      { keepPreviousData: true, refetchOnMount: true },
    );

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const navigate = useNavigate();

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="general.action.cancel"
          fallback="Cancel"
          data-testid="translatedtext-wwhp"
        />
      ),
      action: () => setIsCancelModalOpen(true),
    },
  ];

  const handleRowClick = (_, data) => {
    const { id, startTime } = data;
    navigate(`/appointments/outpatients?appointmentId=${id}&date=${trimToDate(startTime)}`);
  };

  const canWriteAppointment = ability.can('write', 'Appointment');

  const COLUMNS = [
    {
      key: 'startTime',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.date"
          fallback="Date"
          data-testid="translatedtext-vnct"
        />
      ),
      accessor: getDate,
    },
    {
      key: 'outpatientAppointmentArea',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.area"
          fallback="Area"
          data-testid="translatedtext-lnn7"
        />
      ),
      accessor: ({ locationGroup }) => locationGroup?.name,
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={248} data-testid="customcellcomponent-2uhm" />
      ),
    },
    {
      key: 'clinician',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.clinician"
          fallback="Clinician"
          data-testid="translatedtext-yyqg"
        />
      ),
      accessor: ({ clinician }) => clinician?.displayName || '-',
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={139} data-testid="customcellcomponent-6zgq" />
      ),
    },
    {
      key: 'appointmentType',
      title: (
        <TranslatedText
          stringId="patient.appointments.table.column.appointmentType"
          fallback="Appointment type"
          data-testid="translatedtext-yiuf"
        />
      ),
      accessor: ({ appointmentType }) => appointmentType?.name,
      CellComponent: ({ value }) => (
        <CustomCellComponent value={value} $maxWidth={155} data-testid="customcellcomponent-d6gg" />
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
                data-testid="menucontainer-o790"
              >
                <StyledMenuButton actions={actions} data-testid="styledmenubutton-ynql" />
              </MenuContainer>
            ),
          },
        ]
      : []),
  ];

  if (!upcomingAppointments.length && !isLoadingUpcomingAppointments) {
    return (
      <NoDataContainer data-testid="nodatacontainer-zxmc">
        <TableHeader
          title={
            <TranslatedText
              stringId="patient.appointments.table.noData"
              fallback="No outpatient appointments"
              data-testid="translatedtext-sb9h"
            />
          }
          patient={patient}
          data-testid="tableheader-sd66"
          hasPastAppointments={hasPastAppointments}
        />
      </NoDataContainer>
    );
  }

  return (
    <div>
      <StyledTable
        isLoading={isLoadingUpcomingAppointments}
        data={upcomingAppointments}
        columns={COLUMNS}
        allowExport={false}
        TableHeader={
          <TableHeader
            title={
              <TranslatedText
                stringId="patient.appointments.table.title"
                fallback="Outpatient appointments"
                data-testid="translatedtext-ian9"
              />
            }
            patient={patient}
            data-testid="tableheader-kfdu"
            hasPastAppointments={hasPastAppointments}
          />
        }
        onClickRow={handleRowClick}
        orderBy={orderBy}
        order={order}
        onChangeOrderBy={onChangeOrderBy}
        data-testid="styledtable-covg"
      />
      <CancelAppointmentModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        data-testid="cancelappointmentmodal-l4f9"
      />
    </div>
  );
};
