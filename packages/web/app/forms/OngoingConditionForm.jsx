import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';
import { omit } from 'es-toolkit/compat';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { trimToDate } from '@tamanu/utils/dateTime';
import { AutocompleteField, CheckField, DateField, Field } from '../components/Field';
import { TextField, Form, FormGrid, useDateTime } from '@tamanu/ui-components';
import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';
import { DeleteOngoingConditionModal } from '../components/PatientInfoPane/DeleteOngoingConditionModal';
import { InfoPaneFormActions } from '../components/PatientInfoPane/InfoPaneFormActions';

const RESOLUTION_FIELD_NAMES = [
  'resolved',
  'resolutionDate',
  'resolutionNote',
  'resolutionPractitionerId',
];

const resolutionDateLabel = (
  <TranslatedText
    stringId="conditions.resolutionDate.label"
    fallback="Date resolved"
    data-testid="translatedtext-q71w"
  />
);

const ResolutionFields = ({ practitionerSuggester }) => (
  <>
    <Field
      name="resolutionDate"
      label={resolutionDateLabel}
      component={DateField}
      required
      data-testid="field-r84h"
    />
    <Field
      name="resolutionPractitionerId"
      label={
        <TranslatedText
          stringId="patient.ongoingCondition.resolutionPractitionerId.label"
          fallback=":clinician confirming resolution"
          replacements={{
            clinician: (
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                data-testid="translatedtext-8kug"
              />
            ),
          }}
          data-testid="translatedtext-p0km"
        />
      }
      component={AutocompleteField}
      suggester={practitionerSuggester}
      data-testid="field-izs0"
    />
    <Field
      name="resolutionNote"
      label={
        <TranslatedText
          stringId="conditions.resolutionNote.label"
          fallback="Notes on resolution"
          data-testid="translatedtext-qw5q"
        />
      }
      component={TextField}
      data-testid="field-4g2s"
    />
  </>
);

const resolutionDateSchema = yup.date().translatedLabel(resolutionDateLabel);

export const OngoingConditionForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  diagnosisSuggester,
  onDelete,
}) => {
  const { getCurrentDate } = useDateTime();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteSuccess = () => {
    if (onDelete) {
      onDelete();
    }
    onCancel();
  };

  const RenderForm = ({ submitForm, values }) => (
    <FormGrid columns={1} data-testid="formgrid-lqds">
      <NoteModalActionBlocker>
        <Field
          name="conditionId"
          label={
            <TranslatedText
              stringId="conditions.conditionName.label"
              fallback="Condition name"
              data-testid="translatedtext-avk1"
            />
          }
          component={AutocompleteField}
          suggester={diagnosisSuggester}
          required
          data-testid="field-j30y"
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText
              stringId="general.recordedDate.label"
              fallback="Date recorded"
              data-testid="translatedtext-hd0f"
            />
          }
          component={DateField}
          data-testid="field-2775"
        />
        <Field
          name="examinerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid="translatedtext-n0zg"
            />
          }
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid="field-9miu"
        />
        <Field
          name="note"
          label={
            <TranslatedText
              stringId="general.notes.label"
              fallback="Notes"
              data-testid="translatedtext-f0ug"
            />
          }
          component={TextField}
          data-testid="field-e52k"
        />
        {(!editedObject || editedObject.resolved) && (
          <Field
            name="resolved"
            label={
              <TranslatedText
                stringId="conditions.resolved.label"
                fallback="Resolved"
                data-testid="translatedtext-5d9a"
              />
            }
            component={CheckField}
            data-testid="field-c7nr"
          />
        )}
        {!editedObject && (
          <Collapse in={values.resolved} data-testid="collapse-pybu">
            <FormGrid columns={1} nested data-testid="formgrid-to6o">
              <ResolutionFields practitionerSuggester={practitionerSuggester} />
            </FormGrid>
          </Collapse>
        )}
        <InfoPaneFormActions
          onCancel={onCancel}
          onSubmit={submitForm}
          onDelete={editedObject ? () => setDeleteModalOpen(true) : null}
          data-testid="formsubmitcancelrow-2r80"
        />
        <DeleteOngoingConditionModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          conditionToDelete={editedObject}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </NoteModalActionBlocker>
    </FormGrid>
  );

  const onDataSubmit = async data => {
    if (!editedObject && data.resolved) {
      await onSubmit(data);
      return;
    }
    const fields = omit(data, RESOLUTION_FIELD_NAMES);
    const isUnresolving = Boolean(editedObject?.resolved) && !data.resolved;
    await onSubmit(isUnresolving ? { ...fields, resolved: false } : fields);
  };

  const getInitialValues = () => {
    if (editedObject) {
      // Currently both dates are dateTime type in the database, so we need to convert them to date type
      // for now to avoid timezone conversion
      return {
        ...omit(editedObject, RESOLUTION_FIELD_NAMES),
        recordedDate: trimToDate(editedObject.recordedDate),
        resolved: Boolean(editedObject.resolved),
      };
    }
    return {
      recordedDate: getCurrentDate(),
      resolutionDate: getCurrentDate(),
      resolved: false,
    };
  };

  return (
    <Form
      onSubmit={onDataSubmit}
      render={RenderForm}
      initialValues={getInitialValues()}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        conditionId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="conditions.validation.conditionName.path"
            fallback="Condition"
            data-testid="translatedtext-jhfb"
          />,
        ),
        recordedDate: yup.date(),
        examinerId: yup.string(),
        note: yup.string(),

        resolved: yup.boolean(),
        resolutionDate: resolutionDateSchema.when('resolved', {
          is: resolved => !editedObject && resolved,
          then: schema => schema.required(),
        }),
        resolutionPractitionerId: yup.string(),
        resolutionNote: yup.string(),
      })}
      data-testid="form-epwh"
    />
  );
};

OngoingConditionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
  onDelete: PropTypes.func,
};

OngoingConditionForm.defaultProps = {
  editedObject: null,
  onDelete: null,
};

export const ResolveOngoingConditionForm = ({
  onSubmit,
  onCancel,
  editedObject,
  practitionerSuggester,
}) => {
  const { getCurrentDate } = useDateTime();
  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid columns={1} data-testid="formgrid-resolvecondition">
          <NoteModalActionBlocker>
            <ResolutionFields practitionerSuggester={practitionerSuggester} />
            <InfoPaneFormActions
              onCancel={onCancel}
              onSubmit={submitForm}
              data-testid="formsubmitcancelrow-resolvecondition"
            />
          </NoteModalActionBlocker>
        </FormGrid>
      )}
      initialValues={{
        id: editedObject.id,
        resolved: true,
        resolutionDate: getCurrentDate(),
      }}
      formType={FORM_TYPES.EDIT_FORM}
      validationSchema={yup.object().shape({
        resolutionDate: resolutionDateSchema.required(),
        resolutionPractitionerId: yup.string(),
        resolutionNote: yup.string(),
      })}
      data-testid="form-resolvecondition"
    />
  );
};
