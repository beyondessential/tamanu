import React, { useEffect, useCallback } from 'react';

import { connectApi } from 'desktop/app/api';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { SurveySelector } from 'desktop/app/views/programs/SurveySelector';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';

const DumbProgramsView = React.memo(({ onFetchSurvey, onFetchProgramsList }) => {
  const [survey, setSurvey] = React.useState(null);
  const [programsList, setProgramsList] = React.useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await onFetchProgramsList();
      setProgramsList(data);
    })();
  }, []);

  const onSelectSurvey = useCallback(async id => {
    const response = await onFetchSurvey(id);
    setSurvey(response);
  });

  const onCancelSurvey = useCallback(() => {
    setSurvey(null);
  });

  if (!programsList) {
    return <LoadingIndicator loadingText="Loading survey list..." />;
  }

  if (!survey) {
    return <SurveySelector programs={programsList} onSelectSurvey={onSelectSurvey} />;
  }

  return <SurveyView survey={survey} onCancel={onCancelSurvey} />;
});

export const ProgramsView = connectApi(api => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchProgramsList: () => api.get('program'),
}))(DumbProgramsView);
