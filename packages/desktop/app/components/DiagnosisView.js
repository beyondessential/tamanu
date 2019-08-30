import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import Chip from '@material-ui/core/Chip';

import { getDiagnoses } from '../store/visit';

import { Button } from './Button';
import { DiagnosisModal } from './DiagnosisModal';

const DiagnosisHeading = styled.div`
  margin-top: 0.4rem;
  margin-right: 1rem;
`;

const DiagnosisChip = styled(Chip)`
  margin-right: 0.3rem;
`;

const DiagnosisItem = React.memo(({ diagnosis: { name }, isPrimary, onClick }) => (
  <DiagnosisChip 
    onClick={onClick}
    label={`${isPrimary ? 'Primary' : 'Secondary'}: ${name}`}
    variant="outlined"
    color={isPrimary ? 'primary' : 'default'}
  />
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
  align-items: flex-start;
`;

const DiagnosisList = connect(state => ({
  diagnoses: getDiagnoses(state)
    .filter(d => d.diagnosis)
    .sort(compareDiagnosis),
}))(
  React.memo(({ diagnoses, onEditDiagnosis }) => {
    if (diagnoses.length === 0) {
      return <DiagnosisListContainer>No diagnosis recorded.</DiagnosisListContainer>;
    }

    return (
      <DiagnosisListContainer>
        {diagnoses.map(d => (
          <DiagnosisItem key={d._id} {...d} onClick={() => onEditDiagnosis(d)} />
        ))}
      </DiagnosisListContainer>
    );
  }),
);

const DiagnosisGrid = styled.div`
  display: grid;
  grid-template-columns: max-content auto max-content;
`;

export const DiagnosisView = React.memo(({ visitId }) => {
  const [diagnosis, editDiagnosis] = React.useState(null);

  return (
    <React.Fragment>
      <DiagnosisModal diagnosis={diagnosis} visitId={visitId} onClose={() => editDiagnosis(null)} />
      <DiagnosisGrid>
        <DiagnosisHeading>Diagnosis:</DiagnosisHeading>
        <DiagnosisList onEditDiagnosis={d => editDiagnosis(d)} />
        <Button onClick={() => editDiagnosis({})} variant="outlined" color="primary">
          Add diagnosis
        </Button>
      </DiagnosisGrid>
    </React.Fragment>
  );
});
