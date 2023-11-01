import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import Collapse from '@material-ui/core/Collapse';
import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  CheckField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { foreignKey } from '../utils/validation';
import { useLocalisedText } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const OngoingConditionForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  icd10Suggester,
}) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  const RenderForm = ({ submitForm, values }) => {
    const resolving = values.resolved;
    const buttonText = editedObject ? (
      <TranslatedText stringId="general.actions.save" fallback="Save" />
    ) : (
      <TranslatedText stringId="general.actions.add" fallback="Add" />
    );
    return (
      <FormGrid columns={1}>
        <Field
          name="conditionId"
          label={
            <TranslatedText stringId="form.conditions.conditionName" fallback="Condition name" />
          }
          component={AutocompleteField}
          suggester={icd10Suggester}
          disabled={resolving}
          required
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText stringId="form.general.recordedDate.label" fallback="Date recorded" />
          }
          saveDateAsString
          component={DateField}
          disabled={resolving}
        />
        <Field
          name="examinerId"
          label={clinicianText}
          disabled={resolving}
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="note"
          label={<TranslatedText stringId="form.general.notes.label" fallback="Notes" />}
          component={TextField}
          disabled={resolving}
        />
        <Field
          name="resolved"
          label={<TranslatedText stringId="form.conditions.resolved" fallback="Resolved" />}
          component={CheckField}
        />
        <Collapse in={resolving}>
          <FormGrid columns={1}>
            <Field
              name="resolutionDate"
              saveDateAsString
              label="Date resolved"
              component={DateField}
            />
            <Field
              name="resolutionPractitionerId"
              label={`${clinicianText} confirming resolution`}
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field name="resolutionNote" label="Notes on resolution" component={TextField} />
          </FormGrid>
        </Collapse>
        <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText={buttonText} />
      </FormGrid>
    );
  };

  const onDataSubmit = data => {
    if (data.resolved) {
      onSubmit(data);
      return;
    }

    // remove resolution-specific fields if not resolved
    const { resolutionDate, resolutionNote, resolutionPractitionerId, ...rest } = data;
    onSubmit(rest);
  };

  return (
    <Form
      onSubmit={onDataSubmit}
      render={RenderForm}
      initialValues={{
        recordedDate: getCurrentDateTimeString(),
        resolutionDate: getCurrentDateTimeString(),
        resolved: false,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        conditionId: foreignKey('Condition is a required field'),
        recordedDate: yup.date(),
        examinerId: yup.string(),
        note: yup.string(),

        resolved: yup.boolean(),
        resolutionDate: yup.date(),
        resolutionPractitionerId: yup.string(),
        resolutionNote: yup.string(),
      })}
    />
  );
};

OngoingConditionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

OngoingConditionForm.defaultProps = {
  editedObject: null,
};
