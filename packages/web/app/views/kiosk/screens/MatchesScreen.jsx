import React, { useState } from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { useKioskSession } from '../KioskSession';
import { PatientTile, SelectableAppointmentTile, SelectablePatientTile } from '../PatientTile';
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

/**
 * Several appointments to choose between: different patients who share a last name and date of
 * birth, or one patient with more than one appointment today. Only the wording differs — the
 * patient still picks the tile that is theirs.
 */
const SeveralMatches = ({ matches, isSeveralPatients }) => {
  const { session, dispatch } = useKioskSession();
  // Nothing is preselected, unless the patient is coming back to the details they chose
  const [selectedId, setSelectedId] = useState(session.appointment?.id ?? null);
  const selected = matches.find(({ id }) => id === selectedId);

  return (
    <Panel>
      <Title>
        {isSeveralPatients ? (
          <TranslatedText stringId="kiosk.matches.title" fallback="Select your details" />
        ) : (
          <TranslatedText stringId="kiosk.appointments.title" fallback="Select your appointment" />
        )}
      </Title>
      <Lead>
        {isSeveralPatients ? (
          <TranslatedText
            stringId="kiosk.matches.text"
            fallback="More than one patient matches this last name and date of birth. Please select your details to continue."
          />
        ) : (
          <TranslatedText
            stringId="kiosk.appointments.text"
            fallback="You have more than one appointment today. Please select the one you're here for."
          />
        )}
      </Lead>
      {/* One patient's own appointments differ only by time, so their details are stated once */}
      {!isSeveralPatients && <PatientTile appointment={matches[0]} hideAppointment />}
      <TileGrid style={isSeveralPatients ? undefined : { marginTop: scaled(20) }}>
        {matches.map(appointment => {
          const Tile = isSeveralPatients ? SelectablePatientTile : SelectableAppointmentTile;
          return (
            <Tile
              key={appointment.id}
              appointment={appointment}
              isSelected={appointment.id === selectedId}
              onSelect={() => setSelectedId(appointment.id)}
            />
          );
        })}
      </TileGrid>
      <Actions>
        <SecondaryButton onClick={() => dispatch({ type: 'notMe' })}>
          {isSeveralPatients ? (
            <TranslatedText stringId="kiosk.matches.noneAreMe" fallback="None of these are me" />
          ) : (
            <TranslatedText stringId="kiosk.match.notMe" fallback="No, this isn't me" />
          )}
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
  const { matches, isSeveralPatients } = session;
  return matches.length === 1 ? (
    <SingleMatch appointment={matches[0]} />
  ) : (
    <SeveralMatches matches={matches} isSeveralPatients={isSeveralPatients} />
  );
};
