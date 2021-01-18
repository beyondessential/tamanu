import React, { ReactElement, useCallback, useState } from 'react';
import { ISurveyScreenComponent, DataElementType } from '~/types';
import { theme } from '~/ui/styled/theme';
import { checkVisibilityCriteria } from '/helpers/fields';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { Button } from '../../Button';
import { FullView, RowView, StyledText, StyledView } from '~/ui/styled/common';
import { FormScreenView } from '../FormScreenView';

interface AddDetailsFormFieldsProps {
  components: ISurveyScreenComponent[];
  values: any;
  onSubmit: any;
  note: string;
}

export const FormFields = ({
  components,
  values,
  onSubmit,
  note,
}: AddDetailsFormFieldsProps): ReactElement => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

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
    (component: ISurveyScreenComponent) => (
      checkVisibilityCriteria(component, components, values) &&
      !isCalculated(component.dataElement.type)
    ),
    [values]
  );

  const screenComponents = components
    .filter(x => x.screenIndex === currentScreenIndex)
    .sort((a, b) => a.componentIndex - b.componentIndex)
    .filter(shouldShow)
    .map((component, index) => (
      <React.Fragment key={component.id}>
        <SectionHeader marginTop={index === 0 ? 0 : 20} h3>
          {component.text || component.dataElement.defaultText}
        </SectionHeader>
        <ProgramQuestion
          key={component.id}
          component={component}
        />
      </React.Fragment>
    ));
  
  // Note: we set the key on FullView so that React registers it as a whole
  // new component, rather than a component whose contents happen to have 
  // changed. This means that each new page will start at the top, rather than
  // the scroll position continuing across pages.

  return (
    <FullView key={currentScreenIndex}>
      <FormScreenView>
        {screenComponents}
        <RowView width="68%" marginTop={25}>
          <Button 
            margin={5}
            disabled={currentScreenIndex === 0}
            buttonText="Previous Page"
            onPress={onNavigatePrevious} 
          />
          {(currentScreenIndex !== maxIndex) 
            ? <Button margin={5} buttonText="Next Page" onPress={onNavigateNext} />
            : (
              <Button
                margin={5}
                backgroundColor={theme.colors.PRIMARY_MAIN}
                buttonText="Submit"
                onPress={onSubmit}
              />
            )
          }
        </RowView>
        {currentScreenIndex === maxIndex && (
          <StyledView margin={10}>
            <StyledText>{note}</StyledText>
          </StyledView>
        )}
      </FormScreenView>
    </FullView>
  );
};
