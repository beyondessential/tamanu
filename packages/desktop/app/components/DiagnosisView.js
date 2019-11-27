import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getDiagnoses } from '../store/visit';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { DiagnosisList } from './DiagnosisList';
import { Colors } from '../constants';

const DiagnosisHeading = styled.div`
  margin-right: 1rem;
  margin-top: 15px;
  font-weight: 500;
  color: ${Colors.primary};
`;

function compareDiagnosis(a, b) {
  if (a.isPrimary === b.isPrimary) {
    return a.diagnosis.name.localeCompare(b.diagnosis.name);
  }

  if (a.isPrimary) return -1;

  // so b.isPrimary
  return 1;
}

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

export const DiagnosisView = connect(state => ({
  diagnoses: getDiagnoses(state)
    .filter(d => d.diagnosis)
    .sort(compareDiagnosis),
}))(
  React.memo(({ visitId, diagnoses, isTriage, readonly }) => {
    const [diagnosis, editDiagnosis] = React.useState(null);

    return (
      <React.Fragment>
        {!readonly && <DiagnosisModal
          diagnosis={diagnosis}
          isTriage={isTriage}
          visitId={visitId}
          onClose={() => editDiagnosis(null)}
        />}
        <DiagnosisGrid>
          <DiagnosisLabel numberOfDiagnoses={diagnoses.length} />
          <DiagnosisList diagnoses={diagnoses} onEditDiagnosis={!readonly && editDiagnosis} />
          {!readonly && <AddDiagnosisButton onClick={() => editDiagnosis({})} variant="outlined" color="primary">
            Add diagnosis
          </AddDiagnosisButton>}
        </DiagnosisGrid>
      </React.Fragment>
    );
  }),
);
