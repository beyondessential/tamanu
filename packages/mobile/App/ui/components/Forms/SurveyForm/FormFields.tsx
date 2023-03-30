import React, { ReactElement, useCallback, useState, useRef } from 'react';
import { FormikErrors } from 'formik';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { ISurveyScreenComponent } from '../../../../types';
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
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';

const SurveyQuestionErrorView = ({ error }): ReactElement => (
  <TouchableWithoutFeedback onPress={(): void => console.warn(error)}>
    <StyledText color="red">Error displaying component</StyledText>
  </TouchableWithoutFeedback>
);

interface AddDetailsFormFieldsProps {
  components: ISurveyScreenComponent[];
  values: any;
  patient: any;
  note: string;
  errors: FormikErrors;
}

export const FormFields = ({
  components,
  values,
  note,
  patient,
  errors,
}: AddDetailsFormFieldsProps): ReactElement => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const onNavigateNext = useCallback(() => {
    setCurrentScreenIndex(Math.min(currentScreenIndex + 1, maxIndex));
  }, [currentScreenIndex]);

  const onNavigatePrevious = useCallback(() => {
    setCurrentScreenIndex(Math.max(currentScreenIndex - 1, 0));
  }, [currentScreenIndex]);

  const shouldShow = useCallback(
    (component: ISurveyScreenComponent) => checkVisibilityCriteria(component, components, values),
    [values],
  );

  const screenComponents = components
    .filter(x => x.screenIndex === currentScreenIndex)
    .sort((a, b) => a.componentIndex - b.componentIndex)
    .filter(shouldShow)
    .map((component, index) => (
      <React.Fragment key={component.id}>
        <SectionHeader marginTop={index === 0 ? 0 : 20} h3>
          {component.text || component.dataElement.defaultText || ''}
        </SectionHeader>
        {component.detail ? (
          <StyledText marginTop={4} fontSize={screenPercentageToDP('2.2', Orientation.Height)}>
            {component.detail}
          </StyledText>
        ) : null}
        <ErrorBoundary errorComponent={SurveyQuestionErrorView}>
          <SurveyQuestion key={component.id} component={component} patient={patient} />
        </ErrorBoundary>
      </React.Fragment>
    ));

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
