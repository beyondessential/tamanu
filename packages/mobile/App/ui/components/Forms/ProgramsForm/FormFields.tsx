import React, { ReactElement, useCallback } from 'react';
import { AddDetailsFormFieldsProps } from '../../../interfaces/forms/AddDetailsformFieldsProps';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { isCalculated } from '/helpers/fields';

export const FormFields = ({
  components,
  scrollTo,
  verticalPositions,
  values,
}: AddDetailsFormFieldsProps): ReactElement => {
  const shouldShow = useCallback((component) => {
    if(isCalculated(component.dataElement.type)) return false;
    if(!component.visibilityCriteria) return true;

    return component.visibilityCriteria(values);
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
            verticalPositions={verticalPositions}
            component={component}
            scrollTo={scrollTo}
          />
        </React.Fragment>
      ))}
    </>
  );
}
