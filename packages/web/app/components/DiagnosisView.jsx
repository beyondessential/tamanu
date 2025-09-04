import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { DiagnosisList } from './DiagnosisList';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from './Translation/TranslatedText';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

const DiagnosisHeading = styled.div`
  margin-right: 1rem;
  margin-top: 15px;
  font-weight: 500;
  color: ${Colors.primary};
`;

const DiagnosisLabel = React.memo(({ numberOfDiagnoses }) => {
  if (numberOfDiagnoses === 0) {
    return (
      <DiagnosisHeading data-testid="diagnosisheading-gcfy">
        <TranslatedText
          stringId="diagnosis.list.noData"
          fallback="No diagnoses recorded."
          data-testid="translatedtext-6z2v"
        />
      </DiagnosisHeading>
    );
  }

  return (
    <DiagnosisHeading data-testid="diagnosisheading-csy6">
      <TranslatedText
        stringId="diagnosis.list.heading"
        fallback="Diagnosis"
        data-testid="translatedtext-idpc"
      />
      :
    </DiagnosisHeading>
  );
});

const DiagnosisGrid = styled.div`
  margin-top: 30px;
  margin-left: 30px;
  margin-right: 30px;
  display: grid;
  grid-template-columns: max-content auto max-content;
`;

const AddDiagnosisButton = styled(Button)`
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
            fallback="You do not have permission to list diagnoses."
            data-testid="translatedtext-dcsk"
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
          <AddDiagnosisButton
            onClick={() => editDiagnosis({})}
            variant="outlined"
            color="primary"
            disabled={readOnly}
            data-testid="adddiagnosisbutton-2ij9"
          >
            <TranslatedText
              stringId="diagnosis.action.add"
              fallback="Add diagnosis"
              data-testid="translatedtext-2m57"
            />
          </AddDiagnosisButton>
        </NoteModalActionBlocker>
      </DiagnosisGrid>
    </>
  );
});
