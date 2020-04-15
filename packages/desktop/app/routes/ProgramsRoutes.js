import React, { useEffect, useCallback } from 'react';
import { Route, Switch } from 'react-router-dom';

import { connectApi } from 'desktop/app/api';
import { ContentPane } from 'desktop/app/components/ContentPane';
import { NotActiveView } from '../views';
import { SurveyView } from '../views/programs/ProgramsView';

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

const SurveySelector = React.memo(({ onSelectSurvey, programs }) => {
  const programElements = programs.map(p => <ProgramsList onSelectSurvey={onSelectSurvey} program={p} key={p._id} />);

  return (
    <ContentPane>
      <ul>
        { programElements }
      </ul>
    </ContentPane>
  );
});

const DumbSurveyView = React.memo(({ onFetchSurvey, onFetchProgramsList }) => {
  const [survey, setSurvey] = React.useState(null);
  const [programsList, setProgramsList] = React.useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await onFetchProgramsList();
      setProgramsList(data);
    })();
  }, []);

  const onSelectSurvey = useCallback((id) => {
    (async () => {
      const response = await onFetchSurvey(id);
      setSurvey(response);
    })();
  });

  const onCancelSurvey = useCallback(() => {
    setSurvey(null);
  });

  if(!programsList) {
    return <div>Loading survey list...</div>;
  }

  if (!survey) {
    return <SurveySelector programs={programsList} onSelectSurvey={onSelectSurvey} />;
  }

  return <SurveyView survey={survey} onCancel={onCancelSurvey} />;
});

export const ProgramsRoutes = connectApi(api => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchProgramsList: () => api.get('program'),
}))(DumbSurveyView);
