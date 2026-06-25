import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { DiagnosisList } from './DiagnosisList';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from './Translation/TranslatedText';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

const DiagnosisHeading = styled.h2`
  color: ${Colors.primary};
  font: inherit;
  font-weight: 500;
  margin-block: 0;
`;

const DiagnosisLabel = React.memo(({ numberOfDiagnoses }) => {
  if (numberOfDiagnoses === 0) {
    return (
      <DiagnosisHeading data-testid="diagnosisheading-gcfy">
        <TranslatedText stringId="diagnosis.list.noData" fallback="No diagnoses recorded" />
      </DiagnosisHeading>
    );
  }

  return (
    <DiagnosisHeading data-testid="diagnosisheading-csy6">
      <TranslatedText stringId="diagnosis.list.heading" fallback="Diagnosis" />:
    </DiagnosisHeading>
  );
});

const DiagnosisGrid = styled.div`
  align-items: baseline;
  display: grid;
  gap: 1rem;
  grid-template-columns: max-content auto max-content;
  margin-block-start: 30px;
  margin-inline: 30px;
`;

const AddDiagnosisButton = styled(Button).attrs({
  'data-testid': 'adddiagnosisbutton-2ij9',
  color: 'primary',
  variant: 'outlined',
})`
  height: fit-content;
`;

export const DiagnosisView = React.memo(({ encounter, isTriage, readOnly }) => {
  const { diagnoses, id } = encounter;
  const [diagnosis, editDiagnosis] = React.useState(null);
  const { ability } = useAuth();
  const canListDiagnoses = ability?.can('list', 'EncounterDiagnosis');

  const validDiagnoses = diagnoses.filter(d => !['error', 'disproven'].includes(d.certainty));

  const DiagnosesDisplay = canListDiagnoses ? (
    <>
      <DiagnosisLabel numberOfDiagnoses={validDiagnoses.length} data-testid="diagnosislabel-z9sb" />
      <DiagnosisList
        diagnoses={validDiagnoses}
        onEditDiagnosis={!readOnly && editDiagnosis}
        data-testid="diagnosislist-18dz"
      />
    </>
  ) : (
    <>
      <div />
      <Box display="flex" alignItems="center" data-testid="box-myvc">
        <Typography variant="body2" data-testid="typography-2w6q">
          <TranslatedText
            stringId="diagnosis.list.error.forbiddenMessage"
            fallback="You do not have permission to list diagnoses"
          />
        </Typography>
      </Box>
    </>
  );

  return (
    <>
      <DiagnosisModal
        diagnosis={diagnosis}
        isTriage={isTriage}
        encounterId={id}
        excludeDiagnoses={validDiagnoses}
        onClose={() => editDiagnosis(null)}
        data-testid="diagnosismodal-g9yv"
      />
      <DiagnosisGrid data-testid="diagnosisgrid-y0tp">
        {DiagnosesDisplay}
        <NoteModalActionBlocker>
          <AddDiagnosisButton onClick={() => editDiagnosis({})} disabled={readOnly}>
            <TranslatedText stringId="diagnosis.action.add" fallback="Add diagnosis" />
          </AddDiagnosisButton>
        </NoteModalActionBlocker>
      </DiagnosisGrid>
    </>
  );
});
