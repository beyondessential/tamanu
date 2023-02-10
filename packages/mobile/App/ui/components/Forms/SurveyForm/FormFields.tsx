import React, { ReactElement, useCallback, useState, useRef } from 'react';
import { FormikErrors } from 'formik';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { GenericFormValues, IPatient, ISurveyScreenComponent } from '../../../../types';
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

const useScrollToFirstError = () => {
  const [questionPositions, setQuestionPositions] = useState({});

  const scrollToQuestion = (scrollViewRef, questionCode) => {
    const yPosition = questionPositions[questionCode];

    if (scrollViewRef.current !== null) {
      // Allow a bit of space at the top of the form field for the form label text
      const offset = 20;
      scrollViewRef.current?.scrollTo({ x: 0, y: yPosition - offset, animated: true });
    }
  };

  const setQuestionPosition = questionCode => yPosition => {
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
  values: GenericFormValues;
  patient: IPatient;
  note: string;
  errors: FormikErrors<GenericFormValues>;
  validateForm: FormikErrors<GenericFormValues>;
  setStatus: FormikErrors<GenericFormValues>;
}

export const FormFields = ({
  components,
  values,
  note,
  patient,
  errors,
  validateForm,
  setStatus,
}: FormFieldsProps): ReactElement => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const { setQuestionPosition, scrollToQuestion } = useScrollToFirstError();

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const onNavigateNext = async () => {
    const formErrors = await validateForm();
    const pageErrors = Object.keys(formErrors).filter(x =>
      components.map(c => c.dataElement.code).includes(x),
    );
    setStatus(FORM_STATUSES.SUBMIT_ATTEMPTED);

    if (pageErrors.length === 0) {
      setCurrentScreenIndex(Math.min(currentScreenIndex + 1, maxIndex));
    } else {
      const firstErroredQuestion = components.find(({ dataElement }) =>
        pageErrors.includes(dataElement.code),
      );
      scrollToQuestion(scrollViewRef, firstErroredQuestion.dataElement.code);
    }
  };

  const onNavigatePrevious = () => {
    setCurrentScreenIndex(Math.max(currentScreenIndex - 1, 0));
  };

  const shouldShow = useCallback(
    (component: ISurveyScreenComponent) => checkVisibilityCriteria(component, components, values),
    [values],
  );

  const screenComponents = components
    .filter(x => x.screenIndex === currentScreenIndex)
    .sort((a, b) => a.componentIndex - b.componentIndex)
    .filter(shouldShow)
    .map((component, index) => {
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
              setPosition={setQuestionPosition(component.dataElement.code)}
            />
          </ErrorBoundary>
        </React.Fragment>
      );
    });

  // Note: we set the key on FullView so that React registers it as a whole
  // new component, rather than a component whose contents happen to have
  // changed. This means that each new page will start at the top, rather than
  // the scroll position continuing across pages.

  return (
    <FullView key={currentScreenIndex}>
      <FormScreenView scrollViewRef={scrollViewRef}>
        {screenComponents}
        {errors?.form && (
          <StyledText fontSize={16} color={theme.colors.ALERT} marginTop={20}>
            {errors.form}
          </StyledText>
        )}
        <RowView width="68%" marginTop={25}>
          {maxIndex > 1 && (
            <Button
              margin={5}
              disabled={currentScreenIndex === 0}
              buttonText="Previous Page"
              onPress={onNavigatePrevious}
            />
          )}
          {currentScreenIndex !== maxIndex ? (
            <Button margin={5} buttonText="Next Page" onPress={onNavigateNext} />
          ) : (
            <SubmitButton margin={5} />
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
