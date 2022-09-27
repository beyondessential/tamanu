import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
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

const StyledDivider = styled(Divider)`
  margin-top: 30px;
  margin-bottom: 20px;
`;
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

const renderOptionLabel = ({ value, label }) => {
  return value === NOTE_TYPES.TREATMENT_PLAN ? (
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

export const NotePageForm = ({
  practitionerSuggester,
  onCancel,
  notePage,
  noteItems,
  noteTypeCountByType,
  onSubmit,
  onEditNoteItem,
  cancelText = 'Cancel',
  contentRef,
}) => {
  const { currentUser } = useAuth();

  const renderForm = ({ submitForm }) => (
    <>
      {!isEmpty(notePage) && (
        <>
          <StyledFormGrid columns={1}>
            <NoteItemList
              noteItems={noteItems}
              currentUserId={currentUser.id}
              onEditNoteItem={onEditNoteItem}
            />
          </StyledFormGrid>

          <StyledDivider />
        </>
      )}

      <StyledFormGrid columns={3}>
        <Field
          name="noteType"
          label="Type"
          required
          component={SelectField}
          options={getSelectableNoteTypes(noteTypeCountByType)}
          disabled={!isEmpty(notePage)}
          formatOptionLabel={renderOptionLabel}
        />
        <Field
          name="onBehalfOfId"
          label="On behalf of"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="date" label="Date & time" component={DateTimeField} required />
      </StyledFormGrid>

      <Field
        innerRef={el => {
          // a hack to forwarding ref to Formik Field
          // eslint-disable-next-line no-param-reassign
          contentRef.current = el;
        }}
        name="content"
        label="Add note"
        required
        component={TextField}
        multiline
        rows={6}
      />
      <ConfirmCancelRow
        onConfirm={submitForm}
        confirmText="Add note"
        cancelText={cancelText}
        onCancel={onCancel}
      />
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
