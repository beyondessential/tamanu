import React, { useState } from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { useKioskSession } from '../KioskSession';
import { PatientTile, SelectablePatientTile } from '../PatientTile';
import {
  Actions,
  Lead,
  Panel,
  PrimaryButton,
  scaled,
  SecondaryButton,
  Title,
} from '../kioskStyles';

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(${scaled(320)}, 100%), 1fr));
  gap: ${scaled(20)};
`;

const SingleMatch = ({ appointment }) => {
  const { dispatch } = useKioskSession();
  return (
    <Panel>
      <Title>
        <TranslatedText stringId="kiosk.match.title" fallback="Is this you?" />
      </Title>
      <Lead>
        <TranslatedText
          stringId="kiosk.match.text"
          fallback="Check your details before continuing."
        />
      </Lead>
      <PatientTile appointment={appointment} />
      <Actions>
        <SecondaryButton onClick={() => dispatch({ type: 'notMe' })}>
          <TranslatedText stringId="kiosk.match.notMe" fallback="No, this isn't me" />
        </SecondaryButton>
        <PrimaryButton
          $wide
          onClick={() => dispatch({ type: 'confirmed', appointment })}
          data-testid="kiosk-confirm"
        >
          <TranslatedText stringId="kiosk.match.isMe" fallback="Yes, this is me" />
        </PrimaryButton>
      </Actions>
    </Panel>
  );
};

const SeveralMatches = ({ matches }) => {
  const { session, dispatch } = useKioskSession();
  // Nothing is preselected, unless the patient is coming back to the details they chose
  const [selectedId, setSelectedId] = useState(session.appointment?.id ?? null);
  const selected = matches.find(({ id }) => id === selectedId);

  return (
    <Panel>
      <Title>
        <TranslatedText stringId="kiosk.matches.title" fallback="Select your details" />
      </Title>
      <Lead>
        <TranslatedText
          stringId="kiosk.matches.text"
          fallback="More than one patient matches this last name and date of birth. Please select your details to continue."
        />
      </Lead>
      <TileGrid>
        {matches.map(appointment => (
          <SelectablePatientTile
            key={appointment.id}
            appointment={appointment}
            isSelected={appointment.id === selectedId}
            onSelect={() => setSelectedId(appointment.id)}
          />
        ))}
      </TileGrid>
      <Actions>
        <SecondaryButton onClick={() => dispatch({ type: 'notMe' })}>
          <TranslatedText stringId="kiosk.matches.noneAreMe" fallback="None of these are me" />
        </SecondaryButton>
        <PrimaryButton
          $wide
          disabled={!selected}
          onClick={() => dispatch({ type: 'confirmed', appointment: selected })}
          data-testid="kiosk-confirm"
        >
          <TranslatedText stringId="general.action.continue" fallback="Continue" />
        </PrimaryButton>
      </Actions>
    </Panel>
  );
};

export const MatchesScreen = () => {
  const { session } = useKioskSession();
  const { matches } = session;
  return matches.length === 1 ? (
    <SingleMatch appointment={matches[0]} />
  ) : (
    <SeveralMatches matches={matches} />
  );
};
