import React, { ReactElement, useCallback } from 'react';
import { AddDetailsFormFieldsProps } from '../../../interfaces/forms/AddDetailsformFieldsProps';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { isCalculated } from '/helpers/fields';

export const FormFields = ({
  program,
  scrollTo,
  verticalPositions,
  values,
}: AddDetailsFormFieldsProps): ReactElement => {
  const shouldShow = useCallback((question) => {
    if(isCalculated(question.type)) return false;
    if(!question.visibilityCriteria) return true;

    return question.visibilityCriteria(values);
  }, [values]);
  return (
    <React.Fragment>
      {program.questions
      .filter(shouldShow)
      .map((question, index) => (
        <React.Fragment key={question.id}>
          <SectionHeader marginTop={index === 0 ? 0 : 20} h3>
            {question.text}
          </SectionHeader>
          <ProgramQuestion
            key={question.id}
            verticalPositions={verticalPositions}
            question={question}
            scrollTo={scrollTo}
          />
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}
