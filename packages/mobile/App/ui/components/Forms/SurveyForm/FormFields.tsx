import React, {
  Fragment,
  MutableRefObject,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
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
import { TranslatedText } from '../../Translations/TranslatedText';

const useScrollToFirstError = () => {
  const questionPositionsRef = useRef<Record<string, number>>({});

  const scrollToQuestion = useCallback((
    scrollViewRef: MutableRefObject<ScrollView>,
    questionCode: string,
  ): void => {
    const yPosition = questionPositionsRef.current[questionCode];
    if (scrollViewRef.current !== null) {
      const offset = 20;
      scrollViewRef.current?.scrollTo({ x: 0, y: yPosition - offset, animated: true });
    }
  }, []);

  const setQuestionPosition = useCallback((questionCode: string, yPosition: number) => {
    if (yPosition) {
      questionPositionsRef.current[questionCode] = yPosition;
    }
  }, []);

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
  encounter?: { encounterType?: string };
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
  encounter,
  onCancel,
  onGoBack,
}: FormFieldsProps): ReactElement => {
  const scrollViewRef = useRef(null);
  const { errors, validateForm, setStatus, submitForm, values } =
    useFormikContext<GenericFormValues>();
  const { setQuestionPosition, scrollToQuestion } = useScrollToFirstError();

  const [disableSubmit, setDisableSubmit] = useState(false);

  // Stable per-question onLayout callbacks keyed by component code.
  // Uses a ref-map so SurveyQuestion receives the same function identity across renders.
  const layoutCallbacksRef = useRef<Record<string, (y: number) => void>>({});
  const getLayoutCallback = useCallback((code: string) => {
    if (!layoutCallbacksRef.current[code]) {
      layoutCallbacksRef.current[code] = (y: number) => setQuestionPosition(code, y);
    }
    return layoutCallbacksRef.current[code];
  }, [setQuestionPosition]);

  const shouldShow = useCallback(
    (component: ISurveyScreenComponent) => checkVisibilityCriteria(component, components, values),
    [components, values],
  );

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
  }, [onGoBack, currentScreenIndex]);

  const maxIndex = useMemo(
    () => components.reduce((max, x) => Math.max(max, x.screenIndex), 0),
    [components],
  );

  const screenComponents = useMemo(
    () => components
      .filter((x) => x.screenIndex === currentScreenIndex)
      .sort((a, b) => a.componentIndex - b.componentIndex),
    [components, currentScreenIndex],
  );

  const visibleComponents = useMemo(
    () => screenComponents.filter(shouldShow),
    [screenComponents, shouldShow],
  );

  const screenCodeSet = useMemo(
    () => new Set(screenComponents.map((c) => c.dataElement.code)),
    [screenComponents],
  );

  const emptyStateMessage = (
    <TranslatedText
      stringId="general.form.blankPage"
      fallback="This page has been intentionally left blank"
    />
  );

  const submitScreen = async (handleSubmit: () => Promise<void>): Promise<void> => {
    const formErrors = await validateForm();

    const pageErrors = Object.keys(formErrors).filter((x) => screenCodeSet.has(x));

    if (pageErrors.length === 0) {
      setStatus(null);
      await handleSubmit();
    } else {
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
                      zIndex={visibleComponents.length - index}
                      onLayout={getLayoutCallback(component.dataElement.code)}
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
