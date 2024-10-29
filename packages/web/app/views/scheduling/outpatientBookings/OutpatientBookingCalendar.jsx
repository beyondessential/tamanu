import React from 'react';
import { Box } from '@mui/material';
import styled from 'styled-components';

import { Colors } from '../../../constants/index';
import { BodyText, SmallBodyText, TranslatedText } from '../../../components';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Placeholders } from './Placeholders';
import { ThemedTooltip } from '../../../components/Tooltip';

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

const EmptyContainer = styled(Box)`
  width: 100%;
  padding-top: 1rem;
  text-align: center;
`;

const NoResultsText = styled(BodyText)`
  color: ${Colors.primary};
  font-weight: 500;
`;

const NoResultsDisplay = () => (
  <EmptyContainer>
    <NoResultsText>
      <TranslatedText
        stringId="appointments.outpatientCalendar.noAppointments"
        fallback="No appointments to display. Please try adjusting the search filters."
      />
    </NoResultsText>
  </EmptyContainer>
);

export const HeadCell = ({ title, count }) => (
  <HeadCellWrapper>
    <HeadCellTextWrapper>
      <ThemedTooltip title={title}>
        <HeadCellText>{title}</HeadCellText>
      </ThemedTooltip>
    </HeadCellTextWrapper>
    <AppointmentNumber>
      {Number.isInteger(count) && (
        <>
          <SmallBodyText>{count}</SmallBodyText>
          <SmallBodyText color="textTertiary">
            {count === 1 ? (
              <TranslatedText
                stringId="appointments.outpatientCalendar.abbreviatedAppointment"
                fallback="appt"
              />
            ) : (
              <TranslatedText
                stringId="appointments.outpatientCalendar.abbreviatedAppointment.plural"
                fallback="appts"
              />
            )}
          </SmallBodyText>
        </>
      )}
    </AppointmentNumber>
  </HeadCellWrapper>
);

const AppointmentCell = ({ appointments = [] }) => (
  <AppointmentColumnWrapper>
    {appointments.map(a => (
      <AppointmentTile key={a.id} appointment={a} />
    ))}
  </AppointmentColumnWrapper>
);

export const OutpatientBookingCalendar = ({ headData, cellData, titleKey }) => (
  <Wrapper>
    {headData.length === 0 ? (
      <NoResultsDisplay />
    ) : (
      <Box display="flex" width="100%">
        {headData.map(cell => {
          const appointments = cellData[cell.id];
          return (
            <ColumnWrapper key={cell.id}>
              <HeadCell title={cell[titleKey]} count={appointments?.length || 0} />
              <AppointmentCell appointments={appointments} />
            </ColumnWrapper>
          );
        })}
        <Placeholders />
      </Box>
    )}
  </Wrapper>
);
