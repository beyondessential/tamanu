import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { DiagnosisList } from './DiagnosisList';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';

const DiagnosisHeading = styled.div`
  margin-right: 1rem;
  margin-top: 15px;
  font-weight: 500;
  color: ${Colors.primary};
`;

const DiagnosisLabel = React.memo(({ numberOfDiagnoses }) => {
  if (numberOfDiagnoses === 0) {
    return <DiagnosisHeading>No diagnoses recorded.</DiagnosisHeading>;
  }

  return <DiagnosisHeading>Diagnosis:</DiagnosisHeading>;
});

const DiagnosisGrid = styled.div`
  display: grid;
  grid-template-columns: max-content auto max-content;
`;

const AddDiagnosisButton = styled(Button)`
  height: fit-content;
`;

export const DiagnosisView = React.memo(({ encounter, isTriage, readonly }) => {
  const { diagnoses, id } = encounter;
  const [diagnosis, editDiagnosis] = React.useState(null);
  const { ability } = useAuth();
  const canListDiagnoses = ability?.can('list', 'EncounterDiagnosis');

  const validDiagnoses = diagnoses.filter(d => !['error', 'disproven'].includes(d.certainty));

  const DiagnosesDisplay = canListDiagnoses ? (
    <>
      <DiagnosisLabel numberOfDiagnoses={validDiagnoses.length} />
      <DiagnosisList diagnoses={validDiagnoses} onEditDiagnosis={!readonly && editDiagnosis} />
    </>
  ) : (
    <>
      <div />
      <Box display="flex" alignItems="center">
        <Typography variant="body2">You do not have permission to list diagnoses.</Typography>
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
      />
      <DiagnosisGrid>
        {DiagnosesDisplay}
        <AddDiagnosisButton
          onClick={() => editDiagnosis({})}
          variant="outlined"
          color="primary"
          disabled={readonly}
        >
          Add diagnosis
        </AddDiagnosisButton>
      </DiagnosisGrid>
    </>
  );
});
