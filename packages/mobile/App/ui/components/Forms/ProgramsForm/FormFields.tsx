import React, { ReactElement, useCallback, useState } from 'react';
import { ISurveyScreenComponent } from '~/types';
import { theme } from '~/ui/styled/theme';
import { isCalculated } from '/helpers/fields';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { Button } from '../../Button';
import { FullView, RowView, StyledText, StyledView } from '~/ui/styled/common';

function checkVisibilityCriteria(criteria: string, values: any): boolean {
  const [
    elementCode = '',
    expectedAnswer = '',
  ] = criteria.split(/\s*:\s*/);
  const givenAnswer = (values[elementCode] || '').toLowerCase().trim();
  const expectedTrimmed = expectedAnswer.toLowerCase().trim();

  if (expectedTrimmed === givenAnswer) return true;
  if (expectedTrimmed === 'yes' && givenAnswer === true) return true;
  if (expectedTrimmed === 'no' && givenAnswer === false) return true;

  return false;
}

export interface AddDetailsFormFieldsProps {
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
  const [page, setPage] = useState(0);
  const shouldShow = useCallback((component) => {
    if (isCalculated(component.dataElement.type)) return false;
    if (!component.visibilityCriteria) return true;

    return checkVisibilityCriteria(component.visibilityCriteria, values);
  }, [values]);

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const screenComponents = components
    .filter(x => x.screenIndex === page)
    .sort((a, b) => a.componentIndex - b.componentIndex);

  const onNavigateNext = useCallback(() => {
    setPage(Math.min(page + 1, maxIndex));
  }, [page]);
  const onNavigatePrevious = useCallback(() => {
    setPage(Math.max(page - 1, 0));
  }, [page]);

  return (
    <>
      {screenComponents
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
        ))}
      <RowView width="68%"> {/** TODO: correct parent width */}
        <Button margin={5} disabled={page === 0} buttonText="Previous Page" onPress={onNavigatePrevious} />
        {page !== maxIndex ? <Button margin={5} buttonText="Next Page" onPress={onNavigateNext} />
          : (
            <Button
              margin={5}
              backgroundColor={theme.colors.PRIMARY_MAIN}
              buttonText="Submit"
              onPress={onSubmit}
            />
          )

        }
        {page === maxIndex && (
          <StyledView margin={10}>
            <StyledText>{note}</StyledText>
          </StyledView>
        ) }
      </RowView>
    </>
  );
};
