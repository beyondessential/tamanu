import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { VIEW_TYPES } from '@tamanu/constants';

import { TranslatedText } from '../../../components';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';

const Wrapper = styled(Box)`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  display: flex;
  align-items: center;
  block-size: 2.4rem;
  position: relative;
  justify-content: space-between;
  padding: 0.125rem;
  background-color: ${Colors.white};
  border-radius: calc(infinity * 1px);
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  user-select: none;
  margin-right: 0.275rem;
`;

const ToggleButton = styled('button')`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  position: relative;
  appearance: none;
  color: ${Colors.primary};
  border: none;
  background: none;
  width: 6.65rem;
  text-align: center;
  font-weight: 500;
  font-family: inherit;
  font-size: 0.75rem;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  &[aria-checked='true'] {
    color: ${Colors.white};
  }
`;
ToggleButton.defaultProps = { role: 'radio' };

const AnimatedBackground = styled('div')`
  position: absolute;
  width: 6.6rem;
  left: 0.18rem;
  height: 2rem;
  border-radius: 50px;
  background-color: ${Colors.primary};
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.28, 1.13);
  transform: ${({ $toggled }) => ($toggled ? 'translateX(0)' : 'translateX(6.563rem)')};
`;
AnimatedBackground.defaultProps = { 'aria-hidden': true };

export const ViewTypeToggle = props => {
  const { disabled } = props;
  const { viewType = VIEW_TYPES.DAILY, setViewType } = useLocationBookingsContext();

  const handleViewChange = () => {
    if (disabled) return;
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
      <ToggleButton
        aria-checked={viewType === VIEW_TYPES.DAILY}
        data-testid="daily-view-button"
        disabled={disabled}
      >
        <TranslatedText
          stringId="locationBooking.calendar.view.daily"
          fallback="Daily"
          data-testid="daily-view-text"
        />
      </ToggleButton>
      <ToggleButton
        aria-checked={viewType === VIEW_TYPES.WEEKLY}
        data-testid="weekly-view-button"
        disabled={disabled}
      >
        <TranslatedText
          stringId="locationBooking.calendar.view.weekly"
          fallback="Weekly"
          data-testid="weekly-view-text"
        />
      </ToggleButton>
    </Wrapper>
  );
};
