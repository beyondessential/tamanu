import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { connectApi } from 'desktop/app/api';
import { NotActiveView } from '../views';
import { SurveyView } from '../views/programs/ProgramsView';


const DumbSurveyView = React.memo(({ onFetchSurvey }) => {
  const [survey, setSurvey] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const response = await onFetchSurvey();
      setSurvey(response);
    })();
  }, []);

  if(!survey) {
    return <div>Loading...</div>;
  }

  return <SurveyView survey={survey} />;
});

export const ProgramsRoutes = connectApi(api => ({
  onFetchSurvey: () => api.get('survey/123'),
}))(DumbSurveyView);
