import React, { ReactElement } from 'react';
import { AddDetailsFormFieldsProps } from '../../../interfaces/forms/AddDetailsformFieldsProps';
import { ProgramQuestion } from './ProgramQuestion';
import { SectionHeader } from '../../SectionHeader';

export const FormFields = ({
  program,
  scrollTo,
  verticalPositions,
}: AddDetailsFormFieldsProps): ReactElement => (
  <React.Fragment>
    {program.questions.map((question, index) => (
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
