import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { VIEW_TYPES, USER_PREFERENCES_KEYS } from '@tamanu/constants';

import { TranslatedText } from '../../../components';
import { Colors } from '../../../constants';
import { LOCATION_BOOKINGS_EMPTY_FILTER_STATE, useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { useUserPreferencesMutation } from '../../../api/mutations';
import { useAuth } from '../../../contexts/Auth';

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
  border: max(0.0625rem, 1px) solid ${Colors.primary};
  user-select: none;
  margin-inline-end: auto;
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
  const { viewType = VIEW_TYPES.DAILY, setViewType, setFilters } = useLocationBookingsContext();
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
  const updateUserPreferences = viewType => {
    mutateUserPreferences({
      key: USER_PREFERENCES_KEYS.LOCATION_BOOKING_VIEW_TYPE,
      value: viewType,
    });
    mutateUserPreferences({
      key: USER_PREFERENCES_KEYS.LOCATION_BOOKING_FILTERS,
      value: LOCATION_BOOKINGS_EMPTY_FILTER_STATE,
    });
  };

  const handleViewChange = () => {
    if (disabled) return;
    const newViewType = viewType === VIEW_TYPES.WEEKLY ? VIEW_TYPES.DAILY : VIEW_TYPES.WEEKLY;
    setViewType(newViewType);
    setFilters(LOCATION_BOOKINGS_EMPTY_FILTER_STATE);

    updateUserPreferences(newViewType);
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
