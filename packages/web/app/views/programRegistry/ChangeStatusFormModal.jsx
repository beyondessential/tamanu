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

  const changeStatus = async changedStatus => {
    const { ...rest } = patientProgramRegistration;
    delete rest.id;
    delete rest.date;

    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, ...changedStatus, date: getCurrentDateTimeString(), clinicianId: currentUser.id },
    );

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
            data-test-id='translatedtext-ym8z' />
        }
        open={open}
        onClose={onClose}
        overrideContentPadding
      >
        <Form
          showInlineErrorsOnly
          onSubmit={changeStatus}
          render={({ submitForm }) => {
            return (
              <div>
                <StyledFormGrid columns={1}>
                  <Field
                    name="clinicalStatusId"
                    label={
                      <TranslatedText
                        stringId="programRegistry.clinicalStatus.label"
                        fallback="Status"
                        data-test-id='translatedtext-udzr' />
                    }
                    component={AutocompleteField}
                    suggester={programRegistryStatusSuggester}
                    data-test-id='field-iked' />
                </StyledFormGrid>
                <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
                <ConfirmCancelRow
                  style={{ padding: '0px 30px' }}
                  onConfirm={submitForm}
                  onCancel={onClose}
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
        />
      </Modal>
    </>
  );
};
