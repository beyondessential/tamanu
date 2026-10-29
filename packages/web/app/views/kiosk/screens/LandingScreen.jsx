import React from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { CalendarIcon, NextIcon } from '../KioskIcons';
import { useKioskSession } from '../KioskSession';
import { Lead, Panel, PrimaryButton, scaled, StateIcon, Title } from '../kioskStyles';

const LandingIcon = styled(StateIcon)`
  width: ${scaled(112)};
  height: ${scaled(112)};
  margin-bottom: ${scaled(28)};
`;

const LandingTitle = styled(Title)`
  font-size: ${scaled(44)};
  margin-bottom: ${scaled(12)};
`;

const LandingLead = styled(Lead)`
  font-size: ${scaled(20)};
  margin-bottom: ${scaled(40)};
`;

const StartButton = styled(PrimaryButton)`
  min-height: ${scaled(76)};
  min-width: ${scaled(340)};
  font-size: ${scaled(22)};
`;

export const LandingScreen = ({ facilityName }) => {
  const { dispatch } = useKioskSession();
  return (
    <Panel $centred>
      <LandingIcon>
        <CalendarIcon />
      </LandingIcon>
      <LandingTitle>
        {facilityName ? (
          <TranslatedText
            stringId="kiosk.landing.title"
            fallback="Welcome to :facilityName"
            replacements={{ facilityName }}
          />
        ) : (
          <TranslatedText stringId="kiosk.landing.titleWithoutFacility" fallback="Welcome" />
        )}
      </LandingTitle>
      <LandingLead>
        <TranslatedText
          stringId="kiosk.landing.text"
          fallback="Check in for your appointment here."
        />
      </LandingLead>
      <StartButton onClick={() => dispatch({ type: 'start' })} data-testid="kiosk-start">
        <TranslatedText stringId="kiosk.landing.start" fallback="Start check-in" />
        <NextIcon />
      </StartButton>
    </Panel>
  );
};
