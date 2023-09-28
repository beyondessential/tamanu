import React, {
  ReactElement,
  useCallback,
  useState,
  useRef,
  MutableRefObject,
  useEffect,
} from 'react';
import { useFormikContext } from 'formik';
import { ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IPatient, ISurveyScreenComponent } from '../../../../types';
import { checkVisibilityCriteria } from '../../../helpers/fields';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { SurveyQuestion } from './SurveyQuestion';
import { FormScreenView } from '../FormScreenView';
import { SubmitButton } from '../SubmitButton';
import { SectionHeader } from '../../SectionHeader';
import { Button } from '../../Button';
import { ErrorBoundary } from '../../ErrorBoundary';
import { FullView, RowView, StyledText, StyledView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { FORM_STATUSES } from '/helpers/constants';
import { GenericFormValues } from '~/models/Forms';
import { BackHandler } from 'react-native';

interface UseScrollToFirstError {
  setQuestionPosition: (yPosition: string) => void;
  scrollToQuestion: (scrollViewRef: any, questionCode: string) => void;
}

const useScrollToFirstError = (): UseScrollToFirstError => {
  const [questionPositions, setQuestionPositions] = useState<{ [key: string]: string }>({});

  const scrollToQuestion = (
    scrollViewRef: MutableRefObject<ScrollView>,
    questionCode: string,
  ): void => {
    const yPosition = questionPositions[questionCode];

    if (scrollViewRef.current !== null) {
      // Allow a bit of space at the top of the form field for the form label text
      const offset = 20;
      scrollViewRef.current?.scrollTo({ x: 0, y: yPosition - offset, animated: true });
    }
  };

  const setQuestionPosition = (questionCode: string) => (yPosition: string) => {
    if (yPosition) {
      setQuestionPositions(x => ({ ...x, [questionCode]: yPosition }));
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
  note: string;
  onCancel?: () => Promise<void>;
  onGoBack?: () => void;
  currentScreenIndex: number;
  setCurrentScreenIndex: (index: number) => void;
}

export const FormFields = ({
  components,
  currentScreenIndex,
  setCurrentScreenIndex,
  note,
  patient,
  onCancel,
  onGoBack,
}: FormFieldsProps): ReactElement => {
  const scrollViewRef = useRef(null);
  const { errors, validateForm, setStatus, submitForm, values, resetForm } = useFormikContext<
    GenericFormValues
  >();
  const { setQuestionPosition, scrollToQuestion } = useScrollToFirstError();

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const screenComponents = components
    .filter(x => x.screenIndex === currentScreenIndex)
    .sort((a, b) => a.componentIndex - b.componentIndex);

  const submitScreen = async (handleSubmit: () => Promise<void>): Promise<void> => {
    // Validate form on screen before moving to the next one
    const formErrors = await validateForm();

    // Only include components that are on this page
    const pageErrors = Object.keys(formErrors).filter(x =>
      screenComponents.map(c => c.dataElement.code).includes(x),
    );

    if (pageErrors.length === 0) {
      setStatus(null);
      await handleSubmit();
    } else {
      // Only show error messages once the user has attempted to submit the form
      setStatus(FORM_STATUSES.SUBMIT_SCREEN_ATTEMPTED);

      const firstErroredQuestion = components.find(({ dataElement }) =>
        pageErrors.includes(dataElement.code),
      );
      scrollToQuestion(scrollViewRef, firstErroredQuestion.dataElement.code);
    }
  };

  const onNavigateNext = async (): Promise<void> => {
    await submitScreen(() => {
      setCurrentScreenIndex(Math.min(currentScreenIndex + 1, maxIndex));
    });
  };

  const onSubmit = async (): Promise<void> => {
    await submitScreen(async () => {
      await submitForm();
      resetForm();
    });
  };

  const shouldShow = useCallback(
    (component: ISurveyScreenComponent) => checkVisibilityCriteria(component, components, values),
    [values],
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
  }, [currentScreenIndex]); // Re-subscribe if screen index changes, otherwise onGoBack() won't work.

  // Note: we set the key on FullView so that React registers it as a whole
  // new component, rather than a component whose contents happen to have
  // changed. This means that each new page will start at the top, rather than
  // the scroll position continuing across pages.
  return (
    <FullView key={currentScreenIndex}>
      <FormScreenView scrollViewRef={scrollViewRef}>
        {screenComponents.filter(shouldShow).map((component, index) => {
          const validationCriteria = component && component.getValidationCriteriaObject();
          return (
            <React.Fragment key={component.id}>
              <StyledView marginTop={index === 0 ? 0 : 20} flexDirection="row" alignItems="center">
                <SectionHeader h3>
                  {component.text || component.dataElement.defaultText || ''}
                </SectionHeader>
                {validationCriteria.mandatory && (
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
                <StyledText marginTop={4} fontSize={screenPercentageToDP(2.2, Orientation.Height)}>
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
                />
              </ErrorBoundary>
            </React.Fragment>
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
              buttonText="Cancel"
              onPress={onCancel}
            />
          )}
          {currentScreenIndex !== maxIndex ? (
            <Button margin={5} buttonText="Next" onPress={onNavigateNext} />
          ) : (
            <SubmitButton margin={5} onSubmit={onSubmit} />
          )}
        </RowView>
        {currentScreenIndex === maxIndex && (
          <StyledView margin={10}>
            <StyledText color={theme.colors.TEXT_DARK}>{note}</StyledText>
          </StyledView>
        )}
      </FormScreenView>
    </FullView>
  );
};
