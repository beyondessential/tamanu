import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants/index';
import { Box } from '@mui/material';
import { BodyText, SmallBodyText } from '../../../components';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Placeholders } from './Placeholders';
import { ThemedTooltip } from '../../../components/Tooltip';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

export const CELL_WIDTH_PX = 224;

const Wrapper = styled(Box)`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: auto;
  border-block-start: 1px solid ${Colors.outline};
`;

export const ColumnWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  width: ${CELL_WIDTH_PX}px;
  &:not(:last-child) {
    border-inline-end: 1px solid ${Colors.outline};
  }
`;

const HeadCellWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${CELL_WIDTH_PX}px;
  text-align: center;
`;

const AppointmentNumber = styled(Box)`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  height: 1.1rem;
  gap: 0.25rem;
  padding-inline-end: 0.25rem;
  border-block: 1px solid ${Colors.outline};
`;

const HeadCellTextWrapper = styled(Box)`
  height: 4rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const HeadCellText = styled(BodyText)`
  font-weight: 400;
  display: -webkit-box;
  padding-inline: 0.5rem;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AppointmentColumnWrapper = styled(Box)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  gap: 0.5rem;
`;

export const HeadCell = ({ title, count = 0 }) => (
  <HeadCellWrapper>
    <HeadCellTextWrapper>
      <ThemedTooltip title={title}>
        <HeadCellText>{title}</HeadCellText>
      </ThemedTooltip>
    </HeadCellTextWrapper>
    <AppointmentNumber>
      {title && (
        <>
          <SmallBodyText>{count}</SmallBodyText>
          <SmallBodyText color="textTertiary">appts</SmallBodyText>
        </>
      )}
    </AppointmentNumber>
  </HeadCellWrapper>
);

const AppointmentCell = ({ appointments = [] }) => (
  <AppointmentColumnWrapper>
    {appointments.map(a => (
      <>
        <AppointmentTile key={a.id} appointment={a} />
        <AppointmentTile key={a.id + '1'} appointment={a} />
        <AppointmentTile key={a.id + '2'} appointment={a} />
        <AppointmentTile
          key={a.id + '4'}
          appointment={{ ...a, status: APPOINTMENT_STATUSES.CANCELLED }}
        />
        <AppointmentTile
          key={a.id + '3'}
          appointment={{ ...a, status: APPOINTMENT_STATUSES.NO_SHOW }}
        />
        <AppointmentTile key={a.id + '4'} appointment={a} />
        <AppointmentTile key={a.id + '5'} appointment={a} />
        <AppointmentTile key={a.id + '6'} appointment={a} />
        <AppointmentTile key={a.id + '7'} appointment={a} />
        <AppointmentTile key={a.id + '8'} appointment={a} />
      </>
    ))}
  </AppointmentColumnWrapper>
);

export const OutpatientBookingCalendar = ({ headData, cellData, titleKey }) => {
  return (
    <Wrapper>
      <Box display="flex" width="100%">
        {headData.map(cell => {
          const appointments = cellData[cell.id];
          return (
            <ColumnWrapper key={cell.id}>
              <HeadCell title={cell[titleKey]} count={appointments?.length} />
              <AppointmentCell appointments={appointments} />
            </ColumnWrapper>
          );
        })}
        <Placeholders />
      </Box>
    </Wrapper>
  );
};
