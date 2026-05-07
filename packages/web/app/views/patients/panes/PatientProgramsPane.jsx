import React from 'react';
import { useParams, useNavigate } from 'react-router';
import styled from 'styled-components';
import { ContentPane, Heading4, NoteModalActionBlocker, TableButtonRow } from '../../../components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { PortalSurveyAssignmentsTable } from '../../../components/PortalSurveyAssignmentsTable';
import { useSettings } from '../../../contexts/Settings';
import { useAuth } from '../../../contexts/Auth';

const Header = styled.header`
  padding: 0.9rem 1.2rem 0.8rem;
  border-bottom: 1px solid ${Colors.outline};
`;

const TableWrapper = styled.div`
  margin-block-end: 1.5rem;
`;

const TableHeader = () => (
  <Header>
    <Heading4 style={{ marginBlock: 0 }}>
      <TranslatedText stringId="program.table.forms.header" fallback="Program forms" />
    </Heading4>
  </Header>
);

export const PatientProgramsPane = React.memo(({ endpoint, patient }) => {
  const navigate = useNavigate();
  const { category, patientId } = useParams();
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const isPatientPortalEnabled = getSetting('features.patientPortal');
  const canListPortalForms = ability?.can('list', 'PatientPortalForm');

  const handleNewSurvey = () =>
    navigate(
      `/patients/${encodeURIComponent(category)}/${encodeURIComponent(patientId)}/programs/new`,
    );

  return (
    <ContentPane data-testid="contentpane-8dfj">
      <TableButtonRow variant="small" data-testid="tablebuttonrow-iyka">
        <NoteModalActionBlocker>
          <Button onClick={handleNewSurvey} data-testid="button-i54d">
            <TranslatedText stringId="program.action.newSurvey" fallback="New form" />
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
