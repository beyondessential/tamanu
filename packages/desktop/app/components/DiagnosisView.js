import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getDiagnoses } from '../store/visit';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';
import { Colors } from '../constants';

const DiagnosisHeading = styled.div`
  margin-right: 1rem;
  font-weight: 500;
`;

const DiagnosisChip = styled.div`
  background: rgba(50, 102, 153, 0.1);
  margin-right: 0.3rem;
  padding: 12px;
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

const DiagnosisList = connect(state => ({
  diagnoses: getDiagnoses(state)
    .filter(d => d.diagnosis)
    .sort(compareDiagnosis),
}))(
  React.memo(({ diagnoses, onEditDiagnosis }) => {
    if (diagnoses.length === 0) {
      return (
        <DiagnosisListContainer>
          <DiagnosisHeading>No diagnoses recorded.</DiagnosisHeading>
        </DiagnosisListContainer>
      );
    }

    return (
      <DiagnosisListContainer>
        <DiagnosisHeading>Diagnosis:</DiagnosisHeading>
        {diagnoses.map(d => (
          <DiagnosisItem key={d._id} {...d} onClick={() => onEditDiagnosis(d)} />
        ))}
      </DiagnosisListContainer>
    );
  }),
);

const DiagnosisGrid = styled.div`
  display: grid;
  grid-template-columns: auto max-content;
`;

export const DiagnosisView = React.memo(({ visitId }) => {
  const [diagnosis, editDiagnosis] = React.useState(null);

  return (
    <React.Fragment>
      <DiagnosisModal diagnosis={diagnosis} visitId={visitId} onClose={() => editDiagnosis(null)} />
      <DiagnosisGrid>
        <DiagnosisList onEditDiagnosis={d => editDiagnosis(d)} />
        <Button onClick={() => editDiagnosis({})} variant="outlined" color="primary">
          Add diagnosis
        </Button>
      </DiagnosisGrid>
    </React.Fragment>
  );
});
