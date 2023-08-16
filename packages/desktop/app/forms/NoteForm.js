import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { NOTE_TYPES } from '@tamanu/shared/constants';
import { useLocalisation } from '../contexts/Localisation';
import { useAuth } from '../contexts/Auth';
import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
  TextField,
  SelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { NoteChangeLogs } from '../components/NoteChangeLogs';
import { noteTypes, Colors } from '../constants';

export const NOTE_FORM_MODES = {
  CREATE_NOTE: 'createNote',
  EDIT_NOTE: 'editNote',
  VIEW_NOTE: 'viewNote',
};

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

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
`;
const StyledDivider = styled(Divider)`
  margin-top: 30px;
  margin-bottom: 30px;
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

export const NoteForm = ({
  practitionerSuggester,
  onCancel,
  note,
  noteTypeCountByType,
  noteFormMode = NOTE_FORM_MODES.CREATE_NOTE,
  onSubmit,
  confirmText,
  cancelText = 'Cancel',
  noteContent,
  setNoteContent,
}) => {
  const { currentUser } = useAuth();
  const { getLocalisation } = useLocalisation();

  const handleNoteContentChange = useCallback(e => setNoteContent(e.target.value), [
    setNoteContent,
  ]);

  const renderForm = ({ submitForm }) => (
    <>
      <StyledFormGrid columns={3}>
        <Field
          name="noteType"
          label="Type"
          required={noteFormMode === NOTE_FORM_MODES.CREATE_NOTE}
          component={SelectField}
          options={
            noteFormMode === NOTE_FORM_MODES.CREATE_NOTE
              ? getSelectableNoteTypes(noteTypeCountByType)
              : noteTypes
          }
          disabled={noteFormMode !== NOTE_FORM_MODES.CREATE_NOTE}
          formatOptionLabel={option => renderOptionLabel(option, noteTypeCountByType)}
        />
        <Field
          name="writtenById"
          label="Created by (or on behalf of)"
          required={noteFormMode === NOTE_FORM_MODES.CREATE_NOTE}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          disabled={noteFormMode !== NOTE_FORM_MODES.CREATE_NOTE}
        />
        <Field
          name="date"
          label="Date & time"
          component={DateTimeField}
          required={noteFormMode === NOTE_FORM_MODES.CREATE_NOTE}
          disabled={
            !getLocalisation('features.enableNoteBackdating') ||
            noteFormMode !== NOTE_FORM_MODES.CREATE_NOTE
          }
          saveDateAsString
        />
      </StyledFormGrid>

      {noteFormMode === NOTE_FORM_MODES.VIEW_NOTE ? (
        <NoteChangeLogs note={note} />
      ) : (
        <Field
          name="content"
          label={noteFormMode === NOTE_FORM_MODES.CREATE_NOTE ? 'Add note' : 'Edit note'}
          required
          component={TextField}
          multiline
          value={noteContent}
          onChange={handleNoteContentChange}
          rows={6}
        />
      )}
      <StyledDivider />
      <ConfirmCancelRow
        onConfirm={noteFormMode === NOTE_FORM_MODES.VIEW_NOTE ? onCancel : submitForm}
        confirmText={confirmText}
        cancelText={cancelText}
        onCancel={noteFormMode !== NOTE_FORM_MODES.VIEW_NOTE && onCancel}
      />
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      showInlineErrorsOnly
      initialValues={{
        date: getCurrentDateTimeString(),
        noteType: note?.noteType,
        writtenById: note?.onBehalfOfId || note?.authorId || currentUser.id,
      }}
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf(Object.values(NOTE_TYPES))
          .required('Note type is required'),
        date: yup.date().required('Date is required'),
        content: yup.string().required('Content is required'),
        writtenById: foreignKey('Written by (or on behalf of) is required'),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setNoteContent: PropTypes.func.isRequired,
};
