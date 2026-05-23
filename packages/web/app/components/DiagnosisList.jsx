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
  color: ${Colors.alert};
  &[data-diagnosis-variant='primary'] {
    color: ${Colors.primary};
  }

  background-color: oklch(from currentColor l c h / 10%);
  border-radius: ${props => props.theme.shape.borderRadius}px;
  display: flex;
  font-weight: 500;
  margin: 0.3rem;

  ${p =>
    typeof p.onClick === 'function'
      ? css`
          cursor: pointer;
        `
      : ''}
`;

const Category = styled.div`
  border-start-start-radius: inherit;
  border-end-start-radius: inherit;
  font-weight: 900;
  padding-block: 10px;
  padding-inline: 5px;
  color: ${Colors.white};

  background-color: ${Colors.alert};
  [data-diagnosis-variant='primary'] & {
    background-color: ${Colors.primary};
  }
`;

const DiagnosisName = styled.span`
  border-end-end-radius: inherit;
  border-start-end-radius: inherit;
  padding: 10px;
`;

const DiagnosisItem = React.memo(({ diagnosis, isPrimary, onClick }) => (
  <DiagnosisChip
    data-diagnosis-variant={isPrimary ? 'primary' : 'secondary'}
    onClick={onClick}
    data-testid="diagnosischip-3n28"
  >
    <Category data-testid="category-vwwx">
      {isPrimary ? (
        <TranslatedText stringId="encounter.diagnosis.type.primary" fallback="P" />
      ) : (
        <TranslatedText stringId="encounter.diagnosis.type.secondary" fallback="S" />
      )}
    </Category>
    {diagnosis?.name && diagnosis?.id && (
      <DiagnosisName data-testid="diagnosisname-vvn4">
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
