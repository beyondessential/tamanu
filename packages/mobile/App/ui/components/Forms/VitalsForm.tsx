import React from 'react';
import { useSelector } from 'react-redux';
import { SurveyTypes } from '~/types';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import usePatientAdditionalDataRecordQuery from '~/ui/hooks/queries/usePatientAdditionalDataRecordQuery';
import useVitalsSurveyQuery from '~/ui/hooks/queries/useVitalsSurveyQuery';
import { useCurrentScreen } from '~/ui/hooks/useCurrentScreen';
import useSurveySubmitMutation from '~/ui/hooks/useSurveySubmitMutation';
import { FullView, StyledText } from '~/ui/styled/common';
import { ErrorScreen } from '/components/ErrorScreen';
import { SurveyForm } from '/components/Forms/SurveyForm';
import { LoadingScreen } from '/components/LoadingScreen';
import { VitalsDataElements } from '/helpers/constants';
import type { ReduxStoreProps } from '/interfaces/ReduxStoreProps';
import type { PatientStateProps } from '/store/ducks/patient';
import { theme } from '/styled/theme';

interface VitalsFormProps {
  onAfterSubmit: () => void;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({ onAfterSubmit }) => {
  const { getTranslation } = useTranslation();
  const { currentScreenIndex, setCurrentScreenIndex } = useCurrentScreen();

  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const { mutateAsync: submitVitals } = useSurveySubmitMutation({ surveyType: SurveyTypes.Vitals });
  const {
    data: vitalsSurvey,
    error: vitalsError,
    isPending: isVitalsLoading,
  } = useVitalsSurveyQuery({ includeAllVitals: false });
  const {
    data: patientAdditionalData,
    error: padError,
    isPending: isPadLoading,
  } = usePatientAdditionalDataRecordQuery(selectedPatient.id);

  const error = vitalsError || padError;
  const isLoading = isVitalsLoading || isPadLoading;
  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!vitalsSurvey) {
    return (
      <FullView>
        <StyledText fontWeight="bold">Error:</StyledText>
        <StyledText paddingLeft="12px" color={theme.colors.ALERT}>
          Vitals survey could not be found
        </StyledText>
      </FullView>
    );
  }

  const { id, components, dateComponent } = vitalsSurvey;

  const onSubmit = async (values: any): Promise<void> => {
    const responseRecord = await submitVitals({
      patientId: selectedPatient.id,
      surveyId: id,
      components,
      values: { ...values, [dateComponent.dataElement.code]: new Date() },
    });

    if (responseRecord) {
      onAfterSubmit();
    }
  };

  // On mobile, date is programmatically submitted
  const visibleComponents = components.filter(
    c => c.dataElementId !== VitalsDataElements.dateRecorded,
  );

  return (
    <SurveyForm
      patient={selectedPatient}
      patientAdditionalData={patientAdditionalData}
      components={visibleComponents}
      onSubmit={onSubmit}
      validate={(values: object): object => {
        const errors: { form?: string } = {};

        if (Object.values(values).every(x => x === '' || x === null)) {
          errors.form = getTranslation(
            'validation.rule.atLeastOneRecording',
            'At least one recording is required',
          );
        }
        return errors;
      }}
      setCurrentScreenIndex={setCurrentScreenIndex}
      currentScreenIndex={currentScreenIndex}
    />
  );
};
