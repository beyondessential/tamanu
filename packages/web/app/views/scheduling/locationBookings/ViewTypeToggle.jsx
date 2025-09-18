import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';

import { TranslatedText } from '../../../components';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';

const Wrapper = styled(Box)`
  cursor: pointer;
  display: flex;
  align-items: center;
  block-size: 2.4rem;
  position: relative;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${TAMANU_COLORS.white};
  border-radius: calc(infinity * 1px);
  border: max(0.0625rem, 1px) solid ${TAMANU_COLORS.outline};
  user-select: none;
  margin-right: 0.275rem;
`;

const ToggleButton = styled('button')`
  cursor: pointer;
  position: relative;
  appearance: none;
  color: ${TAMANU_COLORS.primary};
  border: none;
  background: none;
  width: 6.65rem;
  text-align: center;
  font-weight: 500;
  font-family: inherit;
  font-size: 0.75rem;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  &[aria-checked='true'] {
    color: ${TAMANU_COLORS.white};
  }
`;
ToggleButton.defaultProps = { role: 'radio' };

const AnimatedBackground = styled('div')`
  position: absolute;
  width: 6.6rem;
  left: 0.2rem;
  height: 2rem;
  border-radius: 50px;
  background-color: ${TAMANU_COLORS.primary};
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  transform: ${({ $toggled }) => ($toggled ? 'translateX(0)' : 'translateX(6.563rem)')};
`;
AnimatedBackground.defaultProps = { 'aria-hidden': true };

export const VIEW_TYPES = {
  WEEKLY: 'weekly',
  DAILY: 'daily',
};

export const ViewTypeToggle = props => {
  const { viewType = VIEW_TYPES.DAILY, setViewType } = useLocationBookingsContext();

  const handleViewChange = () => {
    const newViewType = viewType === VIEW_TYPES.WEEKLY ? VIEW_TYPES.DAILY : VIEW_TYPES.WEEKLY;
    setViewType(newViewType);
  };

  return (
    <Wrapper
      onClick={handleViewChange}
      role="radiogroup"
      {...props}
      data-testid="viewtypetoggle-main"
    >
      <AnimatedBackground
        $toggled={viewType === VIEW_TYPES.DAILY}
        data-testid="animatedbackground-viewtype"
      />
      <ToggleButton aria-checked={viewType === VIEW_TYPES.DAILY} data-testid="daily-view-button">
        <TranslatedText
          stringId="locationBooking.calendar.view.daily"
          fallback="Daily"
          data-testid="daily-view-text"
        />
      </ToggleButton>
      <ToggleButton aria-checked={viewType === VIEW_TYPES.WEEKLY} data-testid="weekly-view-button">
        <TranslatedText
          stringId="locationBooking.calendar.view.weekly"
          fallback="Weekly"
          data-testid="weekly-view-text"
        />
      </ToggleButton>
    </Wrapper>
  );
};
