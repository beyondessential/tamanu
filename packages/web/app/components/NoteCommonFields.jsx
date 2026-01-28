import React from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { NOTE_TYPES, NOTE_TYPE_LABELS, NON_EDITABLE_NOTE_TYPES } from '@tamanu/constants';

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

const StyledTooltip = styled((props) => (
  <Tooltip classes={{ popper: props.className }} {...props} data-testid="tooltip-gupn">
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
      data-testid="styledtooltip-tj9s"
    >
      <div>{label}</div>
    </StyledTooltip>
  ) : (
    <div>{label}</div>
  );
};
export const WrittenByField = ({
  label = (
    <TranslatedText
      stringId="note.writtenBy.label"
      fallback="Written by (or on behalf of)"
      data-testid="translatedtext-rzgt"
    />
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
      data-testid="field-ar9q"
    />
  );
};

export const NoteDateTimeField = ({ required, disabled }) => {
  const { getSetting } = useSettings();

  return (
    <Field
      name="date"
      label={
        <TranslatedText
          stringId="note.dateTime.label"
          fallback="Date & time"
          data-testid="translatedtext-jrp9"
        />
      }
      component={DateTimeField}
      required={required}
      disabled={!getSetting('features.enableNoteBackdating') || disabled}
      saveDateAsString
      data-testid="field-nwwl"
    />
  );
};

export const NoteContentField = ({
  label = (
    <TranslatedText
      stringId="note.edit.label"
      fallback="Edit note"
      data-testid="translatedtext-7pw2"
    />
  ),
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
    data-testid="field-wxzr"
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
    data-testid="styledinfocard-t83a"
  >
    <InfoCardItem
      numberOfColumns={numberOfColumns}
      fontSize={14}
      label={
        <TranslatedText
          stringId="note.noteType.label"
          fallback="Note type"
          data-testid="translatedtext-w7oa"
        />
      }
      value={noteType}
      borderHeight={50}
      data-testid="infocarditem-tpuk"
    />
    <InfoCardItem
      numberOfColumns={numberOfColumns}
      fontSize={14}
      label={writtenByLabel}
      value={writtenBy}
      borderHeight={50}
      data-testid="infocarditem-44ig"
    />
    {date && (
      <InfoCardItem
        numberOfColumns={numberOfColumns}
        fontSize={14}
        label={dateLabel}
        value={<DateDisplay date={date} showTime data-testid="datedisplay-cfwj" />}
        borderHeight={50}
        data-testid="infocarditem-0my5"
      />
    )}
  </StyledInfoCard>
);

export const NoteTypeField = ({ required, noteTypeCountByType, onChange }) => (
  <Field
    name="noteType"
    label={
      <TranslatedText
        stringId="note.type.label"
        fallback="Type"
        data-testid="translatedtext-43jz"
      />
    }
    required={required}
    component={TranslatedSelectField}
    enumValues={NOTE_TYPE_LABELS}
    transformOptions={(types) =>
      types
        .filter((option) => !option.hideFromDropdown && !NON_EDITABLE_NOTE_TYPES.includes(option.value))
        .map((option) => ({
          ...option,
          isDisabled:
            noteTypeCountByType &&
            option.value === NOTE_TYPES.TREATMENT_PLAN &&
            !!noteTypeCountByType[option.value],
        }))
    }
    formatOptionLabel={(option) => renderOptionLabel(option, noteTypeCountByType)}
    onChange={onChange}
    data-testid="field-a0mv"
  />
);

export const NoteTemplateField = ({ noteType, onChangeTemplate }) => {
  const templateSuggester = useSuggester('template', {
    baseQueryParameters: { type: noteType },
  });

  return (
    <Field
      name="template"
      label={
        <TranslatedText
          stringId="note.template.label"
          fallback="Template"
          data-testid="translatedtext-xgj5"
        />
      }
      suggester={templateSuggester}
      component={AutocompleteField}
      onChange={(e) => onChangeTemplate(e.target.value)}
      disabled={!noteType}
      data-testid="field-ej08"
    />
  );
};

export const WrittenByText = ({ noteAuthorName, noteOnBehalfOfName }) => (
  <>
    <span>{noteAuthorName || ''} </span>
    {noteOnBehalfOfName ? <span>on behalf of {noteOnBehalfOfName} </span> : null}
  </>
);
