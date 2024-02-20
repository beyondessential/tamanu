import React from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { NOTE_TYPES } from '@tamanu/constants';

import { InfoCard, InfoCardItem } from './InfoCard';
import { AutocompleteField, DateTimeField, Field, TextField } from './Field';
import { useLocalisation } from '../contexts/Localisation';

import { useSuggester } from '../api';
import { DateDisplay } from './DateDisplay';
import { Colors, noteTypes } from '../constants';
import { FormGrid } from './FormGrid';
import { TranslatedText } from './Translation/TranslatedText';
import { SelectField } from './Translation/TranslatedSelectField.jsx';

export const StyledDivider = styled(Divider)`
  margin-top: 30px;
  margin-bottom: 30px;
`;

const StyledInfoCard = styled(InfoCard)`
  border-radius: 0;
  height: 30px;
  & div > span {
    font-size: 14px;
  }
`;

const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  z-index: 1500;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
  }
`;

export const StyledFormGrid = styled(FormGrid)`
  margin-top: 20px;
  margin-bottom: 20px;
`;

/**
 * If there's already a treatment plan note, don't allow users to add another one
 * @param {*} noteTypeCountByType
 * @returns
 */
const getSelectableNoteTypes = noteTypeCountByType =>
  noteTypes
    .filter(x => !x.hideFromDropdown)
    .map(x => ({
      ...x,
      isDisabled:
        noteTypeCountByType &&
        x.value === NOTE_TYPES.TREATMENT_PLAN &&
        !!noteTypeCountByType[x.value],
    }));

const renderOptionLabel = ({ value, label }, noteTypeCountByType) => {
  return value === NOTE_TYPES.TREATMENT_PLAN && noteTypeCountByType[NOTE_TYPES.TREATMENT_PLAN] ? (
    <StyledTooltip
      arrow
      placement="top"
      followCursor
      title="This note type already exists for this encounter"
    >
      <div>{label}</div>
    </StyledTooltip>
  ) : (
    <div>{label}</div>
  );
};
export const WrittenByField = ({
  label = (
    <TranslatedText stringId="note.writtenBy.label" fallback="Written by (or on behalf of)" />
  ),
  required,
  disabled,
}) => {
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <Field
      name="writtenById"
      label={label}
      required={required}
      component={AutocompleteField}
      suggester={practitionerSuggester}
      disabled={disabled}
    />
  );
};

export const NoteDateTimeField = ({ required, disabled }) => {
  const { getLocalisation } = useLocalisation();

  return (
    <Field
      name="date"
      label={<TranslatedText stringId="note.dateTime.label" fallback="Date & time" />}
      component={DateTimeField}
      required={required}
      disabled={!getLocalisation('features.enableNoteBackdating') || disabled}
      saveDateAsString
    />
  );
};

export const NoteContentField = ({
  label = <TranslatedText stringId="note.edit.label" fallback="Edit note" />,
  onChange,
}) => (
  <Field
    name="content"
    label={label}
    required
    component={TextField}
    multiline
    onChange={onChange}
    rows={18}
  />
);

export const NoteInfoSection = ({
  noteType,
  date,
  numberOfColumns,
  writtenByLabel,
  writtenBy,
  dateLabel,
}) => (
  <StyledInfoCard
    gridRowGap={10}
    elevated={false}
    numberOfColumns={numberOfColumns}
    contentPadding={12}
  >
    <InfoCardItem
      numberOfColumns={numberOfColumns}
      fontSize={14}
      label={<TranslatedText stringId="note.noteType.label" fallback="Note type" />}
      value={noteType}
      borderHeight={50}
    />
    <InfoCardItem
      numberOfColumns={numberOfColumns}
      fontSize={14}
      label={writtenByLabel}
      value={writtenBy}
      borderHeight={50}
    />
    {date && (
      <InfoCardItem
        numberOfColumns={numberOfColumns}
        fontSize={14}
        label={dateLabel}
        value={<DateDisplay date={date} showTime />}
        borderHeight={50}
      />
    )}
  </StyledInfoCard>
);

export const NoteTypeField = ({ required, noteTypeCountByType }) => (
  <Field
    name="noteType"
    label={<TranslatedText stringId="note.type.label" fallback="Type" />}
    required={required}
    component={SelectField}
    options={getSelectableNoteTypes(noteTypeCountByType)}
    formatOptionLabel={option => renderOptionLabel(option, noteTypeCountByType)}
    prefix="note.property.type"
  />
);

export const WrittenByText = ({ noteAuthorName, noteOnBehalfOfName }) => (
  <>
    <span>{noteAuthorName || ''} </span>
    {noteOnBehalfOfName ? <span>on behalf of {noteOnBehalfOfName} </span> : null}
  </>
);
