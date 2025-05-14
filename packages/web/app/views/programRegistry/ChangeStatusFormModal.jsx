import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import {
  AutocompleteField,
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
  FormSeparatorLine,
  Modal,
} from '../../components';
import { useAuth } from '../../contexts/Auth';
import { useApi, useSuggester } from '../../api';
import { optionalForeignKey } from '../../utils/validation';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { FORM_TYPES } from '../../constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 70%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const ChangeStatusFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });

  if (!patientProgramRegistration) return <></>;

  const changeStatus = async (changedStatus) => {
    const { ...rest } = patientProgramRegistration;
    delete rest.id;
    delete rest.date;

    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, ...changedStatus, date: getCurrentDateTimeString(), clinicianId: currentUser.id },
    );
    queryClient.invalidateQueries([
      'patient',
      patientProgramRegistration.patientId,
      'programRegistration',
    ]);
    queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
    onClose();
  };

  return (
    <>
      <Modal
        title={
          <TranslatedText
            stringId="programRegistry.modal.changeStatus.title"
            fallback="Change status"
            data-testid="translatedtext-gqu2"
          />
        }
        open={open}
        onClose={onClose}
        overrideContentPadding
        data-testid="modal-jwed"
      >
        <Form
          showInlineErrorsOnly
          onSubmit={changeStatus}
          render={({ submitForm }) => {
            return (
              <div>
                <StyledFormGrid columns={1} data-testid="styledformgrid-y1dv">
                  <Field
                    name="clinicalStatusId"
                    label={
                      <TranslatedText
                        stringId="programRegistry.clinicalStatus.label"
                        fallback="Status"
                        data-testid="translatedtext-dbev"
                      />
                    }
                    component={AutocompleteField}
                    suggester={programRegistryStatusSuggester}
                    data-testid="field-kjuk"
                  />
                </StyledFormGrid>
                <FormSeparatorLine
                  style={{ marginTop: '60px', marginBottom: '30px' }}
                  data-testid="formseparatorline-4vw4"
                />
                <ConfirmCancelRow
                  style={{ padding: '0px 30px' }}
                  onConfirm={submitForm}
                  onCancel={onClose}
                  data-testid="confirmcancelrow-x957"
                />
              </div>
            );
          }}
          initialValues={{
            clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
          }}
          formType={FORM_TYPES.EDIT_FORM}
          validationSchema={yup.object().shape({
            clinicalStatusId: optionalForeignKey(),
          })}
          data-testid="form-qce1"
        />
      </Modal>
    </>
  );
};
