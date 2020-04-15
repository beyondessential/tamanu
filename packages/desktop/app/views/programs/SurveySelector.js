import React, { useEffect, useCallback } from 'react';

import { connectApi } from 'desktop/app/api';
import { ContentPane } from 'desktop/app/components/ContentPane';
import { SurveyView } from 'desktop/app/views/programs/ProgramsView';

const ProgramsList = ({ onSelectSurvey, program }) => {
  const surveys = program.surveys.map(s => (
    <li key={s._id}>
      <a onClick={() => onSelectSurvey(s._id)}>{ s.name }</a>
    </li>
  ));

  return (
    <li>
      <div>{ program.name }</div>
      <ul>
        { surveys }
      </ul>
    </li>
  );
};

export const SurveySelector = React.memo(({ onSelectSurvey, programs }) => {
  const programElements = programs.map(p => <ProgramsList onSelectSurvey={onSelectSurvey} program={p} key={p._id} />);

  return (
    <ContentPane>
      <ul>
        { programElements }
      </ul>
    </ContentPane>
  );
});

