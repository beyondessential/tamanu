import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';
import { FORM_TYPES } from '@tamanu/constants/forms';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { AutocompleteField, CheckField, DateField, Field } from '../components/Field';
import {
  TextField,
  Form,
  FormCancelButton,
  FormSubmitButton,
  FormSubmitCancelRow,
  FormGrid,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';
import { DeleteOngoingConditionModal } from '../components/PatientInfoPane/DeleteOngoingConditionModal';

const Link = styled.span`
  text-decoration: underline;
  cursor: pointer;
  color: ${Colors.darkText};
  font-size: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  ${props => !props.$resolving && 'margin-top: -1.2rem;'}
`;

const StyledFormCancelButton = styled(FormCancelButton)`
  min-width: 61px;
  max-width: 61px;
  padding: 10px 12px;
  height: 35px;
`;

const StyledFormSubmitButton = styled(FormSubmitButton)`
  min-width: 50px;
  max-width: 50px;
  padding: 10px 12px;
  height: 35px;
`;

export const OngoingConditionForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  diagnosisSuggester,
  onDelete,
}) => {
  const { getFacilityCurrentDateString } = useDateTimeFormat();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const RenderForm = ({ submitForm, values }) => {
    const resolving = values.resolved;
    const buttonText = editedObject ? (
      <TranslatedText
        stringId="general.action.save"
        fallback="Save"
        data-testid="translatedtext-5jcb"
      />
    ) : (
      <TranslatedText
        stringId="general.action.add"
        fallback="Add"
        data-testid="translatedtext-rx6s"
      />
    );

    const handleDeleteClick = () => {
      setDeleteModalOpen(true);
    };

    const handleDeleteSuccess = () => {
      if (onDelete) {
        onDelete();
      }
      onCancel();
    };

    return (
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
            disabled={resolving}
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
            saveDateAsString
            component={DateField}
            disabled={resolving}
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
            disabled={resolving}
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
            disabled={resolving}
            data-testid="field-e52k"
          />
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
          <Collapse in={resolving} data-testid="collapse-pybu">
            <FormGrid columns={1} data-testid="formgrid-to6o">
              <Field
                name="resolutionDate"
                saveDateAsString
                label={
                  <TranslatedText
                    stringId="conditions.resolutionDate.label"
                    fallback="Date resolved"
                    data-testid="translatedtext-q71w"
                  />
                }
                component={DateField}
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
            </FormGrid>
          </Collapse>

          {editedObject ? (
            <ButtonRow $resolving={resolving} data-testid="buttonrow-with-delete">
              <Link
                onClick={handleDeleteClick}
                color="secondary"
                data-testid="delete-condition-button"
              >
                <TranslatedText stringId="general.action.delete" fallback="Delete" />
              </Link>
              <Box style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <StyledFormCancelButton onClick={onCancel}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </StyledFormCancelButton>
                <StyledFormSubmitButton onSubmit={submitForm}>{buttonText}</StyledFormSubmitButton>
              </Box>
            </ButtonRow>
          ) : (
            <FormSubmitCancelRow
              onCancel={onCancel}
              onConfirm={submitForm}
              confirmText={buttonText}
              data-testid="formsubmitcancelrow-2r80"
            />
          )}

          <DeleteOngoingConditionModal
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            conditionToDelete={editedObject}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </NoteModalActionBlocker>
      </FormGrid>
    );
  };

  const onDataSubmit = async data => {
    const fields = { ...data };

    if (!fields.resolved) {
      delete fields.resolutionDate;
      delete fields.resolutionNote;
      delete fields.resolutionPractitionerId;
    }

    await onSubmit(fields);
  };

  return (
    <Form
      onSubmit={onDataSubmit}
      render={RenderForm}
      initialValues={{
        recordedDate: getFacilityCurrentDateString(),
        resolutionDate: getFacilityCurrentDateString(),
        resolved: false,
        ...editedObject,
      }}
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
        resolutionDate: yup.date(),
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
