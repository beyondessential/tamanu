import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DataFetchingSurveyResponsesTable } from '../../../components/SurveyResponsesTable';

export const ProgramsPane = connect(null, dispatch => ({
  onNavigateToPrograms: () => dispatch(push('/programs')),
}))(
  React.memo(({ onNavigateToPrograms, patient }) => (
    <div>
      <DataFetchingSurveyResponsesTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={onNavigateToPrograms} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  )),
);
