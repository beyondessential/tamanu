import React from 'react';

import { Button } from 'desktop/app/components/Button';
import { ContentPane } from 'desktop/app/components/ContentPane';

const ProgramsList = ({ onSelectSurvey, program }) => {
  const surveys = program.surveys.map(s => (
    <li key={s._id}>
      <Button onClick={() => onSelectSurvey(s._id)}>{s.name}</Button>
    </li>
  ));

  return (
    <div>
      <h2>{program.name}</h2>
      <ul>{surveys}</ul>
    </div>
  );
};

export const SurveySelector = React.memo(({ onSelectSurvey, programs }) => {
  const programElements = programs.map(p => (
    <ProgramsList onSelectSurvey={onSelectSurvey} program={p} key={p._id} />
  ));

  return <ContentPane>{programElements}</ContentPane>;
});
