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
  margin: 0.3rem;
  cursor: pointer;
  display: flex;
`;

const Category = styled.div`
  background: ${props => (props.isPrimary ? Colors.primary : Colors.alert)};
  font-weight: 900;
  padding: 10px 5px;
  color: ${Colors.white};
  border-radius: 3px 0 0 3px;
`;

const DiagnosisName = styled.span`
  background: ${props => (props.isPrimary ? 'rgba(50,102,153,0.1)' : 'rgba(247, 104, 83, 0.1)')};
  color: ${props => (props.isPrimary ? Colors.primary : Colors.alert)};
  font-weight: 500;
  padding: 10px;
  border-radius: 0 3px 3px 0;
`;

const DiagnosisItem = React.memo(({ diagnosis: { name }, isPrimary, onClick }) => (
  <DiagnosisChip isPrimary={isPrimary} onClick={onClick}>
    <Category isPrimary={isPrimary}>{isPrimary ? 'P' : 'S'}</Category>
    <DiagnosisName isPrimary={isPrimary}>{name}</DiagnosisName>
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
