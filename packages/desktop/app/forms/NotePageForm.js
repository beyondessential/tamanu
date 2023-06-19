import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { VISIBILITY_STATUSES } from '@tamanu/shared/constants';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { useLocalisation } from '../contexts/Localisation';
import { useAuth } from '../contexts/Auth';
import { useNoteTypes } from '../contexts/NoteTypes';
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
import { NoteItemList } from '../components/NoteItemList';
import { Colors } from '../constants';

/**
 * If there's already a treatment plan note, don't allow users to add another one
 * @param {*} noteTypeCountByType
 * @returns
 */
const getSelectableNoteTypes = (noteTypeCountByType, noteTypes, treatmentPlanNoteTypeId) => {
  return noteTypes
    .filter(x => !x.hideFromDropdown)
    .map(x => ({
      ...x,
      isDisabled:
        noteTypeCountByType &&
        x.value === treatmentPlanNoteTypeId &&
        !!noteTypeCountByType[x.value],
    }));
};
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

const renderOptionLabel = ({ value, label }, noteTypeCountByType, treatmentPlanNoteTypeId) => {
  return value === treatmentPlanNoteTypeId && noteTypeCountByType[treatmentPlanNoteTypeId] ? (
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
  const { noteTypes } = useNoteTypes();
  const { getLocalisation } = useLocalisation();

  const { treatmentPlanNoteTypeId, clinicalMobileNoteTypeId, systemNoteTypeId } = getLocalisation(
    'noteTypeIds',
  );
  const orderedNoteTypes = useMemo(
    () =>
      Array.isArray(noteTypes) && [
        noteTypes.find(x => x.value === treatmentPlanNoteTypeId),
        ...noteTypes
          .filter(x => x.value !== treatmentPlanNoteTypeId)
          .map(x => ({
            ...x,
            ...((x.value === clinicalMobileNoteTypeId ||
              x.value === systemNoteTypeId ||
              x.visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) && {
              hideFromDropdown: true,
            }),
          })),
      ],
    [noteTypes, clinicalMobileNoteTypeId, systemNoteTypeId, treatmentPlanNoteTypeId],
  );

  const creatingNewNotePage = isEmpty(notePage);

  const lastNoteItemRef = useCallback(node => {
    if (node !== null) {
      node.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const renderForm = ({ submitForm }) => (
    <>
      {!creatingNewNotePage && (
        <>
          <StyledFormGrid columns={1}>
            <NoteItemList
              noteItems={noteItems}
              currentUserId={currentUser.id}
              onEditNoteItem={onEditNoteItem}
              lastNoteItemRef={lastNoteItemRef}
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
          options={
            creatingNewNotePage
              ? getSelectableNoteTypes(
                  noteTypeCountByType,
                  orderedNoteTypes,
                  treatmentPlanNoteTypeId,
                )
              : orderedNoteTypes
          }
          disabled={!creatingNewNotePage}
          // prettier-ignore
          formatOptionLabel={option => renderOptionLabel(option, noteTypeCountByType, treatmentPlanNoteTypeId)}
        />
        <Field
          name="writtenById"
          label="Written by (or on behalf of)"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="date"
          label="Date & time"
          component={DateTimeField}
          required
          disabled={!getLocalisation('features.enableNoteBackdating')}
          saveDateAsString
        />
      </StyledFormGrid>

      <Field
        inputRef={contentRef}
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
      showInlineErrorsOnly
      initialValues={{
        date: getCurrentDateTimeString(),
        noteType: notePage?.noteType,
        writtenById: currentUser.id,
      }}
      validationSchema={yup.object().shape({
        noteType: yup
          .string()
          .oneOf((noteTypes || []).map(type => type.value))
          .required(),
        date: yup.date().required(),
        content: yup.string().required(),
        writtenById: foreignKey('Written by (or on behalf of) is required'),
      })}
    />
  );
};

NotePageForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
