import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import {
  TranslatedReferenceData,
  TranslatedText,
  UnstyledHtmlButton,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { Colors } from '../constants';

const UnorderedList = styled.ul.attrs({
  'data-testid': 'diagnosislistcontainer-dqkk',
  role: 'list',
})`
  align-items: center;
  color: ${Colors.primary};
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.625rem;
`;

const DiagnosisChip = styled(UnstyledHtmlButton).attrs({
  type: 'button',
})`
  color: ${Colors.alert};
  &[data-diagnosis-type='primary'] {
    color: ${Colors.primary};
  }

  background-color: oklch(from currentColor l c h / 10%);
  border-radius: ${props => props.theme.shape.borderRadius}px;
  display: flex;
  font-weight: 500;

  &:not(:disabled) {
    cursor: pointer;
  }
  &:active {
    background-color: oklch(from currentColor l c h / 20%);
  }
`;

const DiagnosisTypeOrnament = styled.span.attrs({
  'aria-hidden': true,
  'data-testid': 'category-vwwx',
})`
  border-start-start-radius: inherit;
  border-end-start-radius: inherit;
  font-weight: 900;
  padding-block: 10px;
  padding-inline: 5px;
  color: ${Colors.white};

  background-color: ${Colors.alert};
  [data-diagnosis-type='primary'] & {
    background-color: ${Colors.primary};
  }
`;

function DiagnosisTypeAccessibleLabel({ isPrimary }) {
  return (
    <VisuallyHidden>
      (
      {isPrimary ? (
        <TranslatedText
          stringId="encounter.diagnosis.type.primary.full"
          fallback="Primary diagnosis"
          casing="lower"
        />
      ) : (
        <TranslatedText
          stringId="encounter.diagnosis.type.secondary.full"
          fallback="Secondary diagnosis"
          casing="lower"
        />
      )}
      )
    </VisuallyHidden>
  );
}

const DiagnosisName = styled.span.attrs({
  'data-testid': 'diagnosisname-vvn4',
})`
  border-end-end-radius: inherit;
  border-start-end-radius: inherit;
  padding: 10px;
`;

const DiagnosisItem = React.memo(({ diagnosis, isPrimary, ...props }) => (
  <DiagnosisChip data-diagnosis-type={isPrimary ? 'primary' : 'secondary'} {...props}>
    <DiagnosisTypeOrnament>
      {isPrimary ? (
        <TranslatedText stringId="encounter.diagnosis.type.primary" fallback="P" />
      ) : (
        <TranslatedText stringId="encounter.diagnosis.type.secondary" fallback="S" />
      )}
    </DiagnosisTypeOrnament>
    <DiagnosisName>
      {diagnosis?.name && diagnosis?.id && (
        <TranslatedReferenceData
          fallback={diagnosis.name}
          value={diagnosis.id}
          category="diagnosis"
        />
      )}{' '}
      <DiagnosisTypeAccessibleLabel isPrimary={isPrimary} />
    </DiagnosisName>
  </DiagnosisChip>
));

export const DiagnosisList = React.memo(({ diagnoses, onEditDiagnosis }) => (
  <UnorderedList>
    {diagnoses.map((d, index) => (
      <li key={d.id}>
        <DiagnosisItem
          data-testid={`diagnosisitem-037x-${index}`}
          diagnosis={d.diagnosis}
          disabled={!onEditDiagnosis}
          isPrimary={d.isPrimary}
          onClick={onEditDiagnosis ? () => onEditDiagnosis(d) : undefined}
        />
      </li>
    ))}
  </UnorderedList>
));

DiagnosisList.propTypes = {
  onEditDiagnosis: PropTypes.func,
  diagnoses: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};
