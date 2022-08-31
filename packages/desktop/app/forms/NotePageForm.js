import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { NOTE_TYPES } from 'shared/constants';
import { useAuth } from '../contexts/Auth';

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
import { NoteItemList } from '../components/NoteItemList';
import { noteTypes } from '../constants';

const getSelectableNoteTypes = noteTypeCountByType =>
  noteTypes
    .filter(x => !x.hideFromDropdown)
    .map(x => ({ ...x, isDisabled: noteTypeCountByType && !!noteTypeCountByType[x.value] }));

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
`;

export const NotePageForm = ({
  practitionerSuggester,
  onCancel,
  notePage,
  noteItems,
  noteTypeCountByType,
  onSubmit,
  onSaveItem,
}) => {
  const { currentUser } = useAuth();

  const renderForm = ({ submitForm }) => (
    <>
      {!isEmpty(notePage) && (
        <StyledFormGrid columns={1}>
          <NoteItemList
            noteItems={noteItems}
            currentUserId={currentUser.id}
            onSaveItem={onSaveItem}
          />
        </StyledFormGrid>
      )}

      <StyledFormGrid columns={3}>
        <Field
          name="noteType"
          label="Type"
          required
          component={SelectField}
          options={getSelectableNoteTypes(noteTypeCountByType)}
          disabled={!isEmpty(notePage)}
        />
        <Field
          name="onBehalfOfId"
          label="On behalf of"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="date" label="Date & time" component={DateTimeField} required />
      </StyledFormGrid>

      <Field name="content" label="Add note" required component={TextField} multiline rows={6} />
      <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        date: new Date(),
        noteType: notePage?.noteType,
      }}
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf(Object.values(NOTE_TYPES))
          .required(),
        date: yup.date().required(),
        content: yup.string().required(),
      })}
    />
  );
};

NotePageForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
