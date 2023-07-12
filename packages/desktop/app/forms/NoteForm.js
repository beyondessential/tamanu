import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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
  viewingChangeLog = false,
  onSubmit,
  onEditNote,
  confirmText,
  cancelText = 'Cancel',
  noteContent,
  setNoteContent,
}) => {
  const { currentUser } = useAuth();
  const { getLocalisation } = useLocalisation();

  const creatingNewNote = isEmpty(note);

  const handleNoteContentChange = useCallback(e => setNoteContent(e.target.value), [
    setNoteContent,
  ]);

  const renderForm = ({ submitForm }) => (
    <>
      <StyledFormGrid columns={3}>
        <Field
          name="noteType"
          label="Type"
          required
          component={SelectField}
          options={creatingNewNote ? getSelectableNoteTypes(noteTypeCountByType) : noteTypes}
          disabled={!creatingNewNote}
          formatOptionLabel={option => renderOptionLabel(option, noteTypeCountByType)}
        />
        <Field
          name="writtenById"
          label="Written by (or on behalf of)"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          disabled={!creatingNewNote}
        />
        <Field
          name="date"
          label="Date & time"
          component={DateTimeField}
          required
          disabled={!getLocalisation('features.enableNoteBackdating') || !creatingNewNote}
          saveDateAsString
        />
      </StyledFormGrid>

      {viewingChangeLog ? (
        <NoteChangeLogs note={note} />
      ) : (
        <Field
          name="content"
          label={creatingNewNote ? 'Add note' : 'Edit note'}
          required
          component={TextField}
          multiline
          value={noteContent}
          onChange={handleNoteContentChange}
          rows={6}
        />
      )}
      <ConfirmCancelRow
        onConfirm={viewingChangeLog ? onCancel : submitForm}
        confirmText={confirmText}
        cancelText={cancelText}
        onCancel={!viewingChangeLog && onCancel}
      />
    </>
  );

  return (
    <Form
      onSubmit={creatingNewNote ? onSubmit : onEditNote}
      render={renderForm}
      showInlineErrorsOnly
      initialValues={{
        date: getCurrentDateTimeString(),
        noteType: note?.noteType,
        writtenById: currentUser.id,
      }}
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf(Object.values(NOTE_TYPES))
          .required(),
        date: yup.date().required(),
        content: yup.string().required(),
        writtenById: foreignKey('Written by (or on behalf of) is required'),
      })}
    />
  );
};

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setNoteContent: PropTypes.func.isRequired,
};
