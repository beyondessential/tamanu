import React from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router';

import { Colors } from '../../../constants';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';
import { TranslatedText } from '../../../components';
import { useOutpatientAppointmentsContext } from '../../../contexts/OutpatientAppointments';
import { useUserPreferencesMutation } from '../../../api/mutations';
import { useAuth } from '../../../contexts/Auth';
import { debounce } from 'lodash';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';

const Wrapper = styled(Box)`
  cursor: pointer;
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
`;

const ToggleButton = styled('button')`
  cursor: pointer;
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
  transform: ${({ $toggled }) => ($toggled ? 'translateX(6.563rem)' : 'translateX(0)')};
`;
AnimatedBackground.defaultProps = { 'aria-hidden': true };

export const GroupByAppointmentToggle = props => {
  const { groupBy, setGroupBy } = useOutpatientAppointmentsContext();
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);

  const updateGroupByUserPreferences = debounce(
    newGroupBy =>
      mutateUserPreferences({
        key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_GROUP_BY,
        value: newGroupBy,
      }),
    200,
  );

  const navigate = useNavigate();
  const handleChange = () => {
    const newValue =
      groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP
        ? APPOINTMENT_GROUP_BY.CLINICIAN
        : APPOINTMENT_GROUP_BY.LOCATION_GROUP;
    setGroupBy(newValue);
    navigate(`?groupBy=${newValue}`);
    updateGroupByUserPreferences(newValue);
  };

  if (!groupBy) return null;

  return (
    <Wrapper onClick={handleChange} role="radiogroup" {...props} data-testid="wrapper-k0ja">
      <AnimatedBackground
        $toggled={groupBy === APPOINTMENT_GROUP_BY.CLINICIAN}
        data-testid="animatedbackground-dhom"
      />
      <ToggleButton
        aria-checked={groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP}
        data-testid="togglebutton-dqnx"
      >
        <TranslatedText
          stringId="outpatientAppointments.groupByToggle.area"
          fallback="Area"
          data-testid="translatedtext-gxyg"
        />
      </ToggleButton>
      <ToggleButton
        aria-checked={groupBy === APPOINTMENT_GROUP_BY.CLINICIAN}
        data-testid="togglebutton-i33i"
      >
        <TranslatedText
          stringId="outpatientAppointments.groupByToggle.clinicians"
          fallback="Clinicians"
          data-testid="translatedtext-mft6"
        />
      </ToggleButton>
    </Wrapper>
  );
};
