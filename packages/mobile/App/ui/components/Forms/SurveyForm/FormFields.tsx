import React, {
  Fragment,
  MutableRefObject,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormikContext } from 'formik';
import { ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IPatient, ISurveyScreenComponent, GenericFormValues } from '../../../../types';
import { checkMandatory, checkVisibilityCriteria } from '../../../helpers/fields';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { SurveyQuestion } from './SurveyQuestion';
import { FormScreenView } from '../FormScreenView';
import { SubmitButton } from '../SubmitButton';
import { Button } from '../../Button';
import { SectionHeader } from '../../SectionHeader';
import { ErrorBoundary } from '../../ErrorBoundary';
import { FullView, RowView, StyledText, StyledView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import { BackHandler } from 'react-native';
import { useBackendEffect } from '~/ui/hooks';
import { LoadingScreen } from '../../LoadingScreen';
import { ErrorScreen } from '../../ErrorScreen';
import { TranslatedText } from '../../Translations/TranslatedText';

interface UseScrollToFirstError {
  setQuestionPosition: (questionCode: string) => (yPosition: number)  => void;
  scrollToQuestion: (scrollViewRef: any, questionCode: string) => void;
}

const useScrollToFirstError = (): UseScrollToFirstError => {
  const questionPositionsRef = useRef({});

  const scrollToQuestion = (
    scrollViewRef: MutableRefObject<ScrollView>,
    questionCode: string,
  ): void => {
    const yPosition = questionPositionsRef.current[questionCode];

    if (scrollViewRef.current !== null) {
      // Allow a bit of space at the top of the form field for the form label text
      const offset = 20;
      scrollViewRef.current?.scrollTo({ x: 0, y: yPosition - offset, animated: true });
    }
  };

  const setQuestionPosition = (questionCode: string) => (yPosition: string) => {
    if (yPosition) {
      questionPositionsRef.current[questionCode] = yPosition;
    }
  };

  return { setQuestionPosition, scrollToQuestion };
};

const SurveyQuestionErrorView = ({ error }): ReactElement => (
  <TouchableWithoutFeedback onPress={(): void => console.warn(error)}>
    <StyledText color="red">Error displaying component</StyledText>
  </TouchableWithoutFeedback>
);

interface FormFieldsProps {
  components: ISurveyScreenComponent[];
  patient: IPatient;
  isSubmitting: boolean;
  onCancel?: () => Promise<void>;
  onGoBack?: () => void;
  currentScreenIndex: number;
  setCurrentScreenIndex: (index: number) => void;
}

export const FormFields = ({
  components,
  currentScreenIndex,
  setCurrentScreenIndex,
  isSubmitting,
  patient,
  onCancel,
  onGoBack,
}: FormFieldsProps): ReactElement => {
  const scrollViewRef = useRef(null);
  const { errors, validateForm, setStatus, submitForm, values, resetForm } =
    useFormikContext<GenericFormValues>();
  const { setQuestionPosition, scrollToQuestion } = useScrollToFirstError();
  const [encounterResult, encounterError, isEncounterLoading] = useBackendEffect(
    async ({ models }) => {
      const encounter = await models.Encounter.getCurrentEncounterForPatient(patient.id);
      return {
        encounter,
      };
    },
    [patient.id],
  );

  const [disableSubmit, setDisableSubmit] = useState(false);

  const shouldShow = useCallback(
    (component: ISurveyScreenComponent) => checkVisibilityCriteria(component, components, values),
    [components, values],
  );

  // Handle back button press or swipe right gesture
  useEffect(() => {
    const backAction = () => {
      if (!onGoBack) {
        return false;
      }
      onGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [onGoBack, currentScreenIndex]); // Re-subscribe if screen index changes, otherwise onGoBack() won't work.

  if (encounterError) {
    return <ErrorScreen error={encounterError} />;
  }

  if (isEncounterLoading) {
    return <LoadingScreen />;
  }

  const { encounter } = encounterResult || {};
  const maxIndex = components
    .map((x) => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const screenComponents = components
    .filter((x) => x.screenIndex === currentScreenIndex)
    .sort((a, b) => a.componentIndex - b.componentIndex);
  const visibleComponents = screenComponents.filter(shouldShow);

  const emptyStateMessage = (
    <TranslatedText
      stringId="general.form.blankPage"
      fallback="This page has been intentionally left blank"
    />
  );

  const submitScreen = async (handleSubmit: () => Promise<void>): Promise<void> => {
    // Validate form on screen before moving to the next one
    const formErrors = await validateForm();

    // Only include components that are on this page
    const pageErrors = Object.keys(formErrors).filter((x) =>
      screenComponents.map((c) => c.dataElement.code).includes(x),
    );

    if (pageErrors.length === 0) {
      setStatus(null);
      await handleSubmit();
    } else {
      // Only show error messages once the user has attempted to submit the form
      setStatus(SUBMIT_ATTEMPTED_STATUS);

      const firstErroredQuestion = components.find(({ dataElement }) =>
        pageErrors.includes(dataElement.code),
      );
      scrollToQuestion(scrollViewRef, firstErroredQuestion.dataElement.code);
    }
  };

  const onNavigateNext = async (): Promise<void> => {
    await submitScreen(async () => {
      setCurrentScreenIndex(Math.min(currentScreenIndex + 1, maxIndex));
    });
  };

  const onSubmit = async (): Promise<void> => {
    await submitScreen(async () => {
      await submitForm();
      resetForm();
    });
  };

  // Note: we set the key on FullView so that React registers it as a whole
  // new component, rather than a component whose contents happen to have
  // changed. This means that each new page will start at the top, rather than
  // the scroll position continuing across pages.
  return (
    <FullView key={currentScreenIndex}>
      <FormScreenView scrollViewRef={scrollViewRef}>
        {visibleComponents.length === 0
          ? emptyStateMessage
          : visibleComponents.map((component, index) => {
              const validationCriteria = component?.getValidationCriteriaObject();
              const mandatory = checkMandatory(validationCriteria.mandatory, {
                encounterType: encounter?.encounterType,
              });
              return (
                <Fragment key={component.id}>
                  <StyledView
                    marginTop={index === 0 ? 0 : 20}
                    flexDirection="row"
                    alignItems="center"
                  >
                    <SectionHeader h3>
                      {component.text || component.dataElement.defaultText || ''}
                    </SectionHeader>
                    {mandatory && (
                      <StyledText
                        marginLeft={screenPercentageToDP(0.5, Orientation.Width)}
                        fontSize={screenPercentageToDP(1.6, Orientation.Height)}
                        color={theme.colors.ALERT}
                      >
                        *
                      </StyledText>
                    )}
                  </StyledView>
                  {component.detail ? (
                    <StyledText
                      marginTop={2}
                      fontSize={screenPercentageToDP(1.59, Orientation.Height)}
                    >
                      {component.detail}
                    </StyledText>
                  ) : null}
                  <ErrorBoundary errorComponent={SurveyQuestionErrorView}>
                    <SurveyQuestion
                      key={component.id}
                      component={component}
                      patient={patient}
                      zIndex={components.length - index}
                      setPosition={setQuestionPosition(component.dataElement.code)}
                      setDisableSubmit={setDisableSubmit}
                    />
                  </ErrorBoundary>
                </Fragment>
              );
            })}
        {errors?.form && (
          <StyledText fontSize={16} color={theme.colors.ALERT} marginTop={20}>
            {errors.form}
          </StyledText>
        )}
        <RowView width="68%" marginTop={25}>
          {onCancel && (
            <Button
              outline
              borderColor={theme.colors.MAIN_SUPER_DARK}
              borderWidth={0.1}
              margin={5}
              disabled={isSubmitting}
              buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
              onPress={onCancel}
            />
          )}
          {currentScreenIndex !== maxIndex ? (
            <Button
              margin={5}
              buttonText={<TranslatedText stringId="general.action.next" fallback="Next" />}
              onPress={onNavigateNext}
              disabled={disableSubmit}
            />
          ) : (
            <SubmitButton margin={5} onSubmit={onSubmit} disabled={disableSubmit} />
          )}
        </RowView>
      </FormScreenView>
    </FullView>
  );
};
