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
    {program.questions.map((questionList, questionListIndex) => {
      const fields = questionList.list.map(question => (
        <ProgramQuestion
          key={question.id}
          verticalPositions={verticalPositions}
          question={question}
          scrollTo={scrollTo}
        />
      ));
      return (
        <React.Fragment>
          <SectionHeader marginTop={questionListIndex === 0 ? 0 : 20} h3>
            {questionList.title}
          </SectionHeader>
          {fields}
        </React.Fragment>
      );
    })}
  </React.Fragment>
);
