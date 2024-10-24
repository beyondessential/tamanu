import React, { useEffect } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { BodyText, SmallBodyText } from '../../../components';
import { CarouselComponents as CarouselGrid } from '../locationBookings/CarouselComponents';
import { Box } from '@mui/material';

const HeaderTextWrapper = styled.div`
  --base-font-weight: 400;
  font-size: 1rem;
  font-weight: var(--base-font-weight);
  line-height: 1.3;
  width: 10rem;
  height: 60px;
  padding: 0.5rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Wrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-inline-end: 1px solid ${Colors.outline};
`;

const HeaderText = styled(BodyText)`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-wrap: break-word;
`;

const AppointNumberCell = styled.div`
  width: 100%;
  border-top: 1px solid ${Colors.outline};
  padding-inline-end: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 0.25rem;
`;

export const HeaderCell = ({ entity }) => {
  return (
    <Wrapper>
      <HeaderTextWrapper>
        <HeaderText>{entity.displayName}</HeaderText>
      </HeaderTextWrapper>
      <AppointNumberCell>
        <SmallBodyText>0</SmallBodyText>
        <SmallBodyText color="textTertiary">appts</SmallBodyText>
      </AppointNumberCell>
    </Wrapper>
  );
};

export const BookingsCalendarHeader = ({ headerData, cellData }) => {
  return (
    <Box display="flex">
      {headerData.map(d => {
        return (
          <Box key={d.id} display="flex" flexDirection="column">
            <HeaderCell entity={d} id={d.id} key={d.id} />
            {cellData?.[d.id]?.map(cell => (
              <div>{cell.id}</div>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};
