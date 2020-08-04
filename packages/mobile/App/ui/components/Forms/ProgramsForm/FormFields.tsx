import React, { ReactElement } from 'react';
import { AddDetailsFormFieldsProps } from '../../../interfaces/forms/AddDetailsformFieldsProps';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';
import { isCalculated } from '/helpers/fields';

function shouldShow(question): boolean {
  return !isCalculated(question.type);
}

export const FormFields = ({
  program,
  scrollTo,
  verticalPositions,
}: AddDetailsFormFieldsProps): ReactElement => (
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
