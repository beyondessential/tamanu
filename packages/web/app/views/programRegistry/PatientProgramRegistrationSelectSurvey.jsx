import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { REGISTRATION_STATUSES, SURVEY_TYPES } from '@tamanu/constants';
import { useApi } from '../../api';
import { Colors, FORM_TYPES } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { Button } from '../../components/Button';
import { Field, Form, BaseSelectField } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { foreignKey } from '../../utils/validation';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { ConditionalTooltip } from '../../components/Tooltip';
import { useProgramRegistryContext } from '../../contexts/ProgramRegistry';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { getReferenceDataStringId } from '../../components';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';

const DisplayContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  border: 1px solid ${Colors.softOutline};
  font-size: 11px;
  padding: 13px 14px 20px 20px;
  background-color: ${Colors.white};
`;

const StyledFormGrid = styled(FormGrid)`
  width: 100%;
  display: grid;
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

  const { data: surveys } = useQuery(
    ['programSurveys', patientProgramRegistration.programRegistry.programId],
    () =>
      api
        .get(`program/${patientProgramRegistration.programRegistry.programId}/surveys`)
        .then(response => {
          return response.data
            .filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS)
            .map(x => ({ value: x.id, label: x.name }));
        }),
  );

  const { programRegistry } = patientProgramRegistration;

  return (
    <DisplayContainer data-testid="displaycontainer-bjmv">
      <Heading5 data-testid="heading5-c7x6">
        <TranslatedText
          stringId="programRegistry.selectSurveyForm.heading"
          fallback="Select a :programRegistry form below to complete"
          replacements={{
            programRegistry: getTranslation(
              getReferenceDataStringId(programRegistry?.id, 'programRegistry'),
              programRegistry?.name,
            ),
          }}
          data-testid="translatedtext-jgv4"
        />
      </Heading5>
      <Form
        showInlineErrorsOnly
        style={{ width: '100%', marginTop: '5px' }}
        onSubmit={async values => {
          setProgramRegistryId(patientProgramRegistration.programRegistryId);
          navigateToProgramRegistrySurvey(
            patientProgramRegistration.programRegistryId,
            values.surveyId,
            programRegistry.name,
          );
        }}
        formType={FORM_TYPES.CREATE_FORM}
        render={({ values, submitForm }) => {
          const isRemoved =
            patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
          return (
            <StyledFormGrid data-testid="styledformgrid-edgp">
              <ConditionalTooltip
                visible={isRemoved}
                title={
                  <TranslatedText
                    stringId="programRegistry.selectSurveyForm.patientInactive.tooltip"
                    fallback="Patient must be active"
                    data-testid="translatedtext-8uzd"
                  />
                }
                data-testid="conditionaltooltip-aavk"
              >
                <Field
                  name="surveyId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.selectSurveyForm.surveyId.label"
                      fallback="Select form"
                      data-testid="translatedtext-ipam"
                    />
                  }
                  component={BaseSelectField}
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  options={surveys}
                  disabled={isRemoved}
                  data-testid="field-qn2d"
                />
              </ConditionalTooltip>
              <ConditionalTooltip
                title={
                  isRemoved ? (
                    <TranslatedText
                      stringId="programRegistry.selectSurveyForm.patientInactive.tooltip"
                      fallback="Patient must be active"
                      data-testid="translatedtext-exd9"
                    />
                  ) : (
                    <TranslatedText
                      stringId="programRegistry.selectSurveyForm.proceed.tooltip"
                      fallback="Select form to proceed"
                      data-testid="translatedtext-ikjw"
                    />
                  )
                }
                visible={isRemoved || !values.surveyId}
                data-testid="conditionaltooltip-ywcm"
              >
                <div>
                  <NoteModalActionBlocker>
                    <StyledButton
                      variant="contained"
                      onClick={submitForm}
                      disabled={isRemoved || !values.surveyId}
                      isSubmitting={false}
                      data-testid="styledbutton-c26p"
                    >
                      <TranslatedText
                        stringId="programRegistry.selectSurveyForm.action.beginForm"
                        fallback="Begin form"
                        data-testid="translatedtext-ivgk"
                      />
                    </StyledButton>
                  </NoteModalActionBlocker>
                </div>
              </ConditionalTooltip>
            </StyledFormGrid>
          );
        }}
        validationSchema={yup.object().shape({
          surveyId: foreignKey(
            getTranslation('validation.rule.formMustBeSelected', 'A form must be selected'),
          ),
        })}
        data-testid="form-t441"
      />
    </DisplayContainer>
  );
};
