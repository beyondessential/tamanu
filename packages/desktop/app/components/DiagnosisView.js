import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getDiagnoses } from '../store/visit';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { Colors } from '../constants';

const DiagnosisHeading = styled.div`
  margin-right: 1rem;
  margin-top: 15px;
  font-weight: 500;
  color: ${Colors.primary};
`;

const DiagnosisChip = styled.div`
  background: rgba(50, 102, 153, 0.1);
  margin: 0.3rem;
  padding: 10px;
  border-radius: 3px;
`;

const DiagnosisName = styled.span`
  font-weight: 500;
`;

const DiagnosisItem = React.memo(({ diagnosis: { name }, isPrimary, onClick }) => (
  <DiagnosisChip onClick={onClick}>
    {`${isPrimary ? 'Primary' : 'Secondary'}: `}
    <DiagnosisName>{name}</DiagnosisName>
  </DiagnosisChip>
));

function compareDiagnosis(a, b) {
  if (a.isPrimary === b.isPrimary) {
    return a.diagnosis.name.localeCompare(b.diagnosis.name);
  }

  if (a.isPrimary) return -1;

  // so b.isPrimary
  return 1;
}

const DiagnosisListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  color: ${Colors.primary};
`;

const DiagnosisLabel = React.memo(({ numberOfDiagnoses }) => {
  if (numberOfDiagnoses === 0) {
    return <DiagnosisHeading>No diagnoses recorded.</DiagnosisHeading>;
  }

  return <DiagnosisHeading>Diagnosis:</DiagnosisHeading>;
});

const DiagnosisList = React.memo(({ diagnoses, onEditDiagnosis }) => {
  return (
    <DiagnosisListContainer>
      {diagnoses.map(d => (
        <DiagnosisItem key={d._id} {...d} onClick={() => onEditDiagnosis(d)} />
      ))}
    </DiagnosisListContainer>
  );
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
  React.memo(({ visitId, diagnoses }) => {
    const [diagnosis, editDiagnosis] = React.useState(null);

    return (
      <React.Fragment>
        <DiagnosisModal
          diagnosis={diagnosis}
          visitId={visitId}
          onClose={() => editDiagnosis(null)}
        />
        <DiagnosisGrid>
          <DiagnosisLabel numberOfDiagnoses={diagnoses.length} />
          <DiagnosisList diagnoses={diagnoses} onEditDiagnosis={d => editDiagnosis(d)} />
          <AddDiagnosisButton onClick={() => editDiagnosis({})} variant="outlined" color="primary">
            Add diagnosis
          </AddDiagnosisButton>
        </DiagnosisGrid>
      </React.Fragment>
    );
  }),
);
