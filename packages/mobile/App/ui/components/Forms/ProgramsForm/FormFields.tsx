import React, { ReactElement, useCallback } from 'react';
import { AddDetailsFormFieldsProps } from '../../../interfaces/forms/AddDetailsformFieldsProps';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { isCalculated } from '/helpers/fields';

function checkVisibilityCriteria(criteria: string, values: any): boolean {
  const [
    elementCode = '', 
    expectedAnswer = ''
  ] = criteria.split(/\s*:\s*/);
  const givenAnswer = (values[elementCode] || '').toLowerCase().trim();
  const expectedTrimmed = expectedAnswer.toLowerCase().trim();

  if(expectedTrimmed === givenAnswer) return true;
  if(expectedTrimmed === 'yes' && givenAnswer === true) return true;
  if(expectedTrimmed === 'no' && givenAnswer === false) return true;

  return false;
}

export const FormFields = ({
  components,
  values,
}: AddDetailsFormFieldsProps): ReactElement => {
  const shouldShow = useCallback((component) => {
    if (isCalculated(component.dataElement.type)) return false;
    if (!component.visibilityCriteria) return true;

    return checkVisibilityCriteria(component.visibilityCriteria, values);
  }, [values]);
  return (
    <>
      {components
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
    </>
  );
};
