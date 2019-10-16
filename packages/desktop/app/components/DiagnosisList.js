import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Colors } from '../constants';

const DiagnosisListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  color: ${Colors.primary};
`;

const DiagnosisChip = styled.div`
  background: rgba(50, 102, 153, 0.1);
  margin: 0.3rem;
  padding: 10px;
  border-radius: 3px;
  cursor: pointer;
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

export const DiagnosisList = React.memo(({ diagnoses, onEditDiagnosis }) => {
  return (
    <DiagnosisListContainer>
      {diagnoses.map(d => (
        <DiagnosisItem key={d._id} {...d} onClick={() => onEditDiagnosis(d)} />
      ))}
    </DiagnosisListContainer>
  );
});

DiagnosisList.defaultProps = {
  onEditDiagnosis: () => {},
};

DiagnosisList.propTypes = {
  onEditDiagnosis: PropTypes.func,
  diagnoses: PropTypes.arrayOf(PropTypes.shape()),
};
