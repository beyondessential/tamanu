import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import {
  Button,
  ContentPane,
  Heading4,
  NoteModalActionBlocker,
  TableButtonRow,
} from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { PortalSurveyAssignmentsTable } from '../../../components/PortalSurveyAssignmentsTable';
import { Colors } from '../../../constants/index';
import { useSettings } from '../../../contexts/Settings';

const TableWrapper = styled.div`
  margin-bottom: 1.5rem;
`;

const Container = styled.div`
  padding: 0.9rem 1.2rem 0.8rem;
  border-bottom: 1px solid ${Colors.outline};
  h4 {
    margin: 0;
  }
`;

const TableHeader = () => (
  <Container>
    <Heading4>
      <TranslatedText stringId="program.table.forms.header" fallback="Program forms" />
    </Heading4>
  </Container>
);

export const PatientProgramsPane = React.memo(({ endpoint, patient }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { getSetting } = useSettings();
  const isPatientPortalEnabled = getSetting('features.patientPortal');

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <ContentPane data-testid="contentpane-8dfj">
      <TableButtonRow variant="small" data-testid="tablebuttonrow-iyka">
        <NoteModalActionBlocker>
          <Button onClick={handleNewSurvey} data-testid="button-i54d">
            <TranslatedText
              stringId="program.action.newSurvey"
              fallback="New form"
              data-testid="translatedtext-865f"
            />
          </Button>
        </NoteModalActionBlocker>
      </TableButtonRow>

      <TableWrapper>
        <DataFetchingProgramsTable
          TableHeader={<TableHeader />}
          endpoint={endpoint}
          patient={patient}
          data-testid="datafetchingprogramstable-uytn"
        />
      </TableWrapper>
      {isPatientPortalEnabled && <PortalSurveyAssignmentsTable patient={patient} />}
    </ContentPane>
  );
});
