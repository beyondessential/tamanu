import React from 'react';
import { useParams, useNavigate } from 'react-router';
import styled from 'styled-components';
import {
  ContentPane,
  Heading4,
  NoteModalActionBlocker,
  TableButtonRow,
} from '../../../components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { PortalSurveyAssignmentsTable } from '../../../components/PortalSurveyAssignmentsTable';
import { useSettings } from '../../../contexts/Settings';
import { useAuth } from '../../../contexts/Auth';

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
  const navigate = useNavigate();
  const params = useParams();
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const isPatientPortalEnabled = getSetting('features.patientPortal');
  const canListPortalForms = ability?.can('list', 'PatientPortalForm');

  const handleNewSurvey = () =>
    navigate(`/patients/${params.category}/${params.patientId}/programs/new`);

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
      {isPatientPortalEnabled && canListPortalForms && (
        <PortalSurveyAssignmentsTable patient={patient} />
      )}
    </ContentPane>
  );
});
