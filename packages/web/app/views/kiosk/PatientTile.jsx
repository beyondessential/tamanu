import React from 'react';
import styled, { css } from 'styled-components';

import { SEX_LABELS } from '@tamanu/constants';
import { formatLongDate, useDateTime } from '@tamanu/ui-components';

import { TranslatedEnum, TranslatedText } from '../../components';
import { useTranslation } from '../../contexts/Translation';
import { CalendarIcon, CheckIcon } from './KioskIcons';
import { scaled } from './kioskStyles';

const Tile = styled.div`
  position: relative;
  padding: ${scaled(28)} ${scaled(30)};
  border-radius: 16px;
  background: var(--kiosk-surface);
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
  text-align: left;

  ${({ $isCompact }) =>
    $isCompact &&
    css`
      padding: ${scaled(26)};
    `}
`;

const SelectableTile = styled(Tile).attrs({ as: 'button', type: 'button' })`
  width: 100%;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &[aria-pressed='true'] {
    background: var(--kiosk-selected);
    box-shadow: inset 0 0 0 2px var(--kiosk-primary);
  }
`;

const Name = styled.div`
  margin-bottom: ${scaled(22)};
  font-size: ${scaled(30)};
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--kiosk-heading);

  ${({ $isCompact }) =>
    $isCompact &&
    css`
      margin-bottom: ${scaled(18)};
      padding-right: ${scaled(44)};
      font-size: ${scaled(23)};
    `}
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${scaled(150)}, 1fr));
  gap: ${scaled(18)} ${scaled(24)};
  margin: 0;

  dt {
    margin-bottom: ${scaled(4)};
    font-size: ${scaled(14)};
    color: var(--kiosk-text-tertiary);
  }

  dd {
    margin: 0;
    font-size: ${({ $isCompact }) => scaled($isCompact ? 17 : 20)};
    font-weight: 500;
  }
`;

const AppointmentLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${scaled(12)};
  margin-top: ${scaled(24)};
  padding-top: ${scaled(20)};
  border-top: var(--kiosk-border) solid var(--kiosk-line);
  font-size: ${({ $isCompact }) => scaled($isCompact ? 16 : 18)};

  svg {
    width: ${scaled(24)};
    height: ${scaled(24)};
    flex: none;
    color: var(--kiosk-primary);
  }

  b {
    font-weight: 500;
    color: var(--kiosk-heading);
  }
`;

const PickMark = styled.span`
  position: absolute;
  top: ${scaled(24)};
  right: ${scaled(24)};
  width: ${scaled(30)};
  height: ${scaled(30)};
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--kiosk-outline);

  svg {
    display: none;
    width: 100%;
    height: 100%;
    padding: ${scaled(5)};
  }

  [aria-pressed='true'] > & {
    background: var(--kiosk-primary);
    box-shadow: none;
    color: var(--kiosk-on-primary);

    svg {
      display: block;
    }
  }
`;

/** Renders a translated sentence with its `:placeholder` values in bold. */
export const withEmphasis = (template, values) =>
  template.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    const value = values[part.slice(1)];
    // Odd indexes are the placeholders the split captured
    return index % 2 === 1 && value !== undefined ? <b key={index}>{value}</b> : part;
  });

const fullName = ({ firstName, middleName, lastName }) =>
  [firstName, middleName, lastName].filter(Boolean).join(' ');

/** The appointment's time and clinician, which is all that differs between one patient's own. */
const AppointmentDetails = ({ appointment, isCompact, style }) => {
  const { getTranslation } = useTranslation();
  const { formatTime } = useDateTime();
  const { clinician, startTime } = appointment;
  const time = formatTime(startTime);

  return (
    <AppointmentLine $isCompact={isCompact} style={style}>
      <CalendarIcon />
      <span>
        {clinician
          ? withEmphasis(
              getTranslation(
                'kiosk.appointment.timeWithClinician',
                'Today at :time with :clinician',
              ),
              { time, clinician: clinician.displayName },
            )
          : withEmphasis(getTranslation('kiosk.appointment.time', 'Today at :time'), { time })}
      </span>
    </AppointmentLine>
  );
};

/** One of a patient's own appointments, chosen by its time rather than by who it belongs to. */
export const SelectableAppointmentTile = ({ appointment, isSelected, onSelect }) => (
  <SelectableTile $isCompact aria-pressed={isSelected} onClick={onSelect}>
    <PickMark>
      <CheckIcon />
    </PickMark>
    <AppointmentDetails
      appointment={appointment}
      style={{ margin: 0, padding: 0, border: 'none' }}
    />
  </SelectableTile>
);

const TileContents = ({ appointment, isCompact, hideAppointment = false }) => {
  const { getTranslation } = useTranslation();
  const { patient } = appointment;

  return (
    <>
      <Name $isCompact={isCompact}>{fullName(patient)}</Name>
      <Details $isCompact={isCompact}>
        <div>
          <dt>
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
            />
          </dt>
          <dd>{formatLongDate(patient.dateOfBirth, getTranslation)}</dd>
        </div>
        <div>
          <dt>
            <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />
          </dt>
          <dd>
            <TranslatedEnum value={patient.sex} enumValues={SEX_LABELS} />
          </dd>
        </div>
        <div>
          <dt>
            <TranslatedText stringId="kiosk.patient.displayId" fallback="Patient ID" />
          </dt>
          <dd>{patient.displayId}</dd>
        </div>
      </Details>
      {!hideAppointment && <AppointmentDetails appointment={appointment} isCompact={isCompact} />}
    </>
  );
};

export const PatientTile = ({ appointment, hideAppointment = false }) => (
  <Tile>
    <TileContents appointment={appointment} hideAppointment={hideAppointment} />
  </Tile>
);

export const SelectablePatientTile = ({ appointment, isSelected, onSelect }) => (
  <SelectableTile $isCompact aria-pressed={isSelected} onClick={onSelect}>
    <PickMark>
      <CheckIcon />
    </PickMark>
    <TileContents appointment={appointment} isCompact />
  </SelectableTile>
);
