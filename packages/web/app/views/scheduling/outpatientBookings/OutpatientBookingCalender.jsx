import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants/index';
import { Box } from '@mui/material';
import { BodyText, SmallBodyText } from '../../../components';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Placeholders } from './Placeholders';

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

const HeadCellText = styled(BodyText)`
  height: 4rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
  font-weight: 400;
`;

export const HeadCell = ({ title, count = 0 }) => (
  <HeadCellWrapper>
    <HeadCellText>{title}</HeadCellText>
    <AppointmentNumber>
      {title && (
        <>
          <SmallBodyText color="textTertiary">appts</SmallBodyText>
          <SmallBodyText>{count}</SmallBodyText>
        </>
      )}
    </AppointmentNumber>
  </HeadCellWrapper>
);

const AppointmentColumn = ({ appointments = [] }) =>
  appointments.map(a => (
    <Box key={a.id} margin={1}>
      <AppointmentTile appointment={a} />
    </Box>
  ));

export const BookingsCalendar = ({ headerData, cellData, getTitle }) => {
  return (
    <Wrapper>
      <Box display="flex" width="100%">
        {headerData.map(headCell => {
          const appointments = cellData[headCell.id];
          return (
            <ColumnWrapper key={headCell.id}>
              <HeadCell title={getTitle(headCell)} count={appointments?.length} />
              <AppointmentColumn appointments={appointments} />
            </ColumnWrapper>
          );
        })}
        <Placeholders />
      </Box>
    </Wrapper>
  );
};
