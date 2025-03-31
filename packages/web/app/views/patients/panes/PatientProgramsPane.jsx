import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Button, ContentPane, TableButtonRow } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const PatientProgramsPane = React.memo(({ endpoint, patient }) => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={handleNewSurvey} data-test-id='button-7l0s'>
          <TranslatedText
            stringId="program.action.newSurvey"
            fallback="New form"
            data-test-id='translatedtext-9paz' />
        </Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} patient={patient} />
    </ContentPane>
  );
});
