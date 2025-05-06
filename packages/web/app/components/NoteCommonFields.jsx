import React from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { NOTE_TYPES, NOTE_TYPE_LABELS } from '@tamanu/constants';

import { InfoCard, InfoCardItem } from './InfoCard';
import { AutocompleteField, DateTimeField, Field, TextField, TranslatedSelectField } from './Field';

import { useSuggester } from '../api';
import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';
import { FormGrid } from './FormGrid';
import { TranslatedText } from './Translation/TranslatedText';
import { useSettings } from '../contexts/Settings';

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
  const { getSetting } = useSettings();

  return (
    <Field
      name="date"
      label={<TranslatedText stringId="note.dateTime.label" fallback="Date & time" />}
      component={DateTimeField}
      required={required}
      disabled={!getSetting('features.enableNoteBackdating') || disabled}
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
    minRows={18}
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

export const NoteTypeField = ({ required, noteTypeCountByType, onChange }) => (
  <Field
    name="noteType"
    label={<TranslatedText stringId="note.type.label" fallback="Type" />}
    required={required}
    component={TranslatedSelectField}
    enumValues={NOTE_TYPE_LABELS}
    transformOptions={types =>
      types
        .filter(option => !option.hideFromDropdown)
        .map(option => ({
          ...option,
          isDisabled:
            noteTypeCountByType &&
            option.value === NOTE_TYPES.TREATMENT_PLAN &&
            !!noteTypeCountByType[option.value],
        }))
    }
    formatOptionLabel={option => renderOptionLabel(option, noteTypeCountByType)}
    onChange={onChange}
    menuPosition="absolute"
    menuPlacement="auto"
  />
);

export const NoteTemplateField = ({ noteType, onChangeTemplate }) => {
  const templateSuggester = useSuggester('template', {
    baseQueryParameters: { type: noteType },
  });

  return (
    <Field
      name="template"
      label={<TranslatedText stringId="note.template.label" fallback="Template" />}
      suggester={templateSuggester}
      component={AutocompleteField}
      onChange={e => onChangeTemplate(e.target.value)}
      disabled={!noteType}
    />
  );
};

export const WrittenByText = ({ noteAuthorName, noteOnBehalfOfName }) => (
  <>
    <span>{noteAuthorName || ''} </span>
    {noteOnBehalfOfName ? <span>on behalf of {noteOnBehalfOfName} </span> : null}
  </>
);
