import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { REGISTRATION_STATUSES, SURVEY_TYPES, FORM_TYPES } from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { useApi } from '../../api';
import { Heading5 } from '../../components/Typography';
import { Form, Button, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { foreignKey } from '../../utils/validation';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { ConditionalTooltip } from '../../components/Tooltip';
import { useProgramRegistryContext } from '../../contexts/ProgramRegistry';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { ProgramSurveyList } from '../../components/ProgramSurveyList';

const DisplayContainer = styled.div`
  border: 1px solid ${Colors.outline};
  padding: 0 15px 20px 20px;
  border-radius: 5px;
  background-color: ${Colors.white};
`;

const StyledFormGrid = styled(FormGrid)`
  grid-template-columns: 80% 18%;
  justify-content: space-between;
  align-items: flex-end;
`;

const StyledButton = styled(Button)`
  height: 44px;
  background-color: ${Colors.primary};
  color: ${Colors.white};
  width: 100%;
  :disabled {
    background-color: ${Colors.primary};
    color: ${Colors.white};
    opacity: 0.4;
  }
`;

export const PatientProgramRegistrationSelectSurvey = ({ patientProgramRegistration }) => {
  const api = useApi();
  const { navigateToProgramRegistrySurvey } = usePatientNavigation();
  const { getTranslation } = useTranslation();
  const { setProgramRegistryId } = useProgramRegistryContext();
  const patientId = patientProgramRegistration?.patientId;

  const { data: surveys } = useQuery(
    ['programSurveys', patientProgramRegistration.programRegistry.programId, patientId],
    () =>
      api
        .get(`program/${patientProgramRegistration.programRegistry.programId}/surveys`, {
          params: patientId ? { patientId } : {},
        })
        .then(response => {
          return response.data
            .filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS)
            .map(x => ({
              value: x.id,
              label: x.name,
              passesFormVisibility: x.passesFormVisibility,
            }));
        }),
  );

  const { programRegistry } = patientProgramRegistration;

  return (
    <DisplayContainer>
      <Form
        showInlineErrorsOnly
        onSubmit={async values => {
          setProgramRegistryId(patientProgramRegistration.programRegistryId);
          navigateToProgramRegistrySurvey(
            patientProgramRegistration.programRegistryId,
            values.surveyId,
            programRegistry.name,
          );
        }}
        formType={FORM_TYPES.CREATE_FORM}
        render={({ values, setFieldValue, submitForm }) => {
          const isRemoved =
            patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
          const items = (surveys || []).map(survey => {
            const disabled = isRemoved || !survey.passesFormVisibility;
            return {
              value: survey.value,
              label: survey.label,
              disabled,
              showVisibilityTooltip: disabled && !isRemoved,
            };
          });
          return (
            <StyledFormGrid>
              <div>
                <Heading5 mt={1} mb={1}>
                  <TranslatedText
                    stringId="programRegistry.selectSurveyForm.heading"
                    fallback="Select a :programRegistry form below to complete"
                    replacements={{
                      programRegistry: getTranslation(
                        getReferenceDataStringId(programRegistry?.id, 'programRegistry'),
                        programRegistry?.name,
                      ),
                    }}
                  />
                </Heading5>
                <ConditionalTooltip visible={isRemoved} title="Patient must be active">
                  <ProgramSurveyList
                    items={items}
                    selectedValue={values.surveyId}
                    onSelect={id => setFieldValue('surveyId', id)}
                    listMarginBottom={8}
                  />
                </ConditionalTooltip>
              </div>
              <ConditionalTooltip
                title={
                  isRemoved ? (
                    <TranslatedText
                      stringId="programRegistry.selectSurveyForm.patientInactive.tooltip"
                      fallback="Patient must be active"
                    />
                  ) : (
                    <TranslatedText
                      stringId="programRegistry.selectSurveyForm.proceed.tooltip"
                      fallback="Select form to proceed"
                    />
                  )
                }
                visible={isRemoved || !values.surveyId}
              >
                <div>
                  <NoteModalActionBlocker>
                    <StyledButton
                      variant="contained"
                      onClick={submitForm}
                      disabled={isRemoved || !values.surveyId}
                      isSubmitting={false}
                    >
                      <TranslatedText
                        stringId="programRegistry.selectSurveyForm.action.beginForm"
                        fallback="Begin form"
                      />
                    </StyledButton>
                  </NoteModalActionBlocker>
                </div>
              </ConditionalTooltip>
            </StyledFormGrid>
          );
        }}
        validationSchema={yup.object().shape({
          surveyId: foreignKey(),
        })}
      />
    </DisplayContainer>
  );
};
