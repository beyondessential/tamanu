import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Colors } from '../constants';
import { hexToRgba } from '../utils';
import { TranslatedText, TranslatedReferenceData } from './Translation';

const DiagnosisListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  color: ${Colors.primary};
`;

const DiagnosisChip = styled.div`
  margin: 0.3rem;
  ${p => (p.onClick ? `cursor: pointer;` : '')}
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
  background: ${props =>
    props.isPrimary ? `${hexToRgba(Colors.primary, 0.1)}` : `${hexToRgba(Colors.alert, 0.1)}`};
  color: ${props => (props.isPrimary ? Colors.primary : Colors.alert)};
  font-weight: 500;
  padding: 10px;
  border-radius: 0 3px 3px 0;
`;

const DiagnosisItem = React.memo(({ diagnosis, isPrimary, onClick }) => (
  <DiagnosisChip onClick={onClick} data-testid="diagnosischip-3n28">
    <Category isPrimary={isPrimary} data-testid="category-vwwx">
      {isPrimary ? (
        <TranslatedText
          stringId="encounter.diagnosis.type.primary"
          fallback="P"
          data-testid="translatedtext-jz99"
        />
      ) : (
        <TranslatedText
          stringId="encounter.diagnosis.type.secondary"
          fallback="S"
          data-testid="translatedtext-ssu2"
        />
      )}
    </Category>
    {diagnosis?.name && diagnosis?.id && (
      <DiagnosisName isPrimary={isPrimary} data-testid="diagnosisname-vvn4">
        <TranslatedReferenceData
          fallback={diagnosis.name}
          value={diagnosis.id}
          category="diagnosis"
          data-testid="translatedreferencedata-eww0"
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
