import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../constants';
import { TranslatedReferenceData, TranslatedText } from './Translation';

const DiagnosisListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  color: ${Colors.primary};
`;

const DiagnosisChip = styled.div`
  margin: 0.3rem;
  display: flex;
  ${p =>
    typeof p.onClick === 'function'
      ? css`
          cursor: pointer;
        `
      : ''}
`;

const Category = styled.div`
  background-color: ${Colors.alert};
  font-weight: 900;
  padding: 10px 5px;
  color: ${Colors.white};
  border-radius: 3px 0 0 3px;
`;

const DiagnosisName = styled.span`
  background-color: oklch(from currentColor l c h / 10%);
  color: ${Colors.alert};
  font-weight: 500;
  padding: 10px;
  border-radius: 0 3px 3px 0;
`;

const DiagnosisItem = React.memo(({ diagnosis, isPrimary, onClick }) => (
  <DiagnosisChip onClick={onClick} data-testid="diagnosischip-3n28">
    <Category
      isPrimary={isPrimary}
      data-testid="category-vwwx"
      style={{ backgroundColor: isPrimary ? Colors.primary : undefined }}
    >
      {isPrimary ? (
        <TranslatedText stringId="encounter.diagnosis.type.primary" fallback="P" />
      ) : (
        <TranslatedText stringId="encounter.diagnosis.type.secondary" fallback="S" />
      )}
    </Category>
    {diagnosis?.name && diagnosis?.id && (
      <DiagnosisName
        data-testid="diagnosisname-vvn4"
        style={{ color: isPrimary ? Colors.primary : undefined }}
      >
        <TranslatedReferenceData
          fallback={diagnosis.name}
          value={diagnosis.id}
          category="diagnosis"
        />
      </DiagnosisName>
    )}
  </DiagnosisChip>
));

export const DiagnosisList = React.memo(({ diagnoses, onEditDiagnosis }) => (
  <DiagnosisListContainer data-testid="diagnosislistcontainer-dqkk">
    {diagnoses.map((d, index) => (
      <DiagnosisItem
        key={d.id}
        {...d}
        onClick={onEditDiagnosis ? () => onEditDiagnosis(d) : undefined}
        data-testid={`diagnosisitem-037x-${index}`}
      />
    ))}
  </DiagnosisListContainer>
));

DiagnosisList.defaultProps = {
  onEditDiagnosis: () => {},
};

DiagnosisList.propTypes = {
  onEditDiagnosis: PropTypes.func,
  diagnoses: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};
