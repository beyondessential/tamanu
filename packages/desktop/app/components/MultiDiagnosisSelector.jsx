import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { AutocompleteInput } from './Field/AutocompleteField';

const AdderContainer = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: auto min-content;
  align-items: end;
`;

const DiagnosisItem = React.memo(({ diagnosis, onRemove }) => {
  const onSelectDiagnosis = useCallback(() => onRemove(diagnosis.id), [onRemove, diagnosis.id]);
  return (
    <li>
      <>
        (
        <span role="button" tabIndex="0" onClick={onSelectDiagnosis} onKeyUp={onSelectDiagnosis}>
          x
        </span>
        )
      </>
      <span>{` ${diagnosis.name}`}</span>
    </li>
  );
});

const DiagnosisList = ({ diagnoses, onRemove }) => {
  const listContents =
    diagnoses.length > 0 ? (
      diagnoses.map(d => <DiagnosisItem key={d.id} onRemove={onRemove} diagnosis={d} />)
    ) : (
      <li>No diagnoses selected</li>
    );
  return <ul>{listContents}</ul>;
};

export const MultiDiagnosisSelector = React.memo(
  ({ value, limit = 5, onChange, icd10Suggester, name }) => {
    const selectedDiagnoses = useMemo(() => value || [], [value]);
    const [selectedDiagnosisId, setSelectedDiagnosisId] = React.useState(null);

    const updateValue = React.useCallback(
      newValue => {
        onChange({ target: { value: newValue, name } });
      },
      [onChange, name],
    );

    const onDiagnosisChange = React.useCallback(
      ({ target }) => {
        setSelectedDiagnosisId(target.value);
      },
      [setSelectedDiagnosisId],
    );

    const onAdd = React.useCallback(() => {
      if (selectedDiagnosisId) {
        setSelectedDiagnosisId('');

        (async () => {
          const diagnosis = {
            id: selectedDiagnosisId,
            name: await icd10Suggester.fetchCurrentOption(selectedDiagnosisId).label,
          };
          updateValue([...selectedDiagnoses, diagnosis]);
        })();
      }
    }, [selectedDiagnoses, selectedDiagnosisId, updateValue, icd10Suggester]);

    const onRemove = React.useCallback(
      id => {
        const newValues = selectedDiagnoses.filter(x => x.id !== id);
        updateValue(newValues);
      },
      [selectedDiagnoses, updateValue],
    );

    // This forces the autocomplete component to clear when the user hits add.
    // (when the key changes, React treats it as an instruction to destroy the old
    // component, and add a new unrelated component in its place with fresh state)
    const autocompleteForceRerender = selectedDiagnoses.length;

    return (
      <>
        <AdderContainer>
          <AutocompleteInput
            key={autocompleteForceRerender}
            suggester={icd10Suggester}
            value={selectedDiagnosisId}
            onChange={onDiagnosisChange}
            label="Select diagnosis"
          />
          <Button variant="contained" onClick={onAdd} disabled={selectedDiagnoses.length >= limit}>
            Add
          </Button>
        </AdderContainer>
        <DiagnosisList diagnoses={selectedDiagnoses} onRemove={onRemove} />
      </>
    );
  },
);

export const MultiDiagnosisSelectorField = ({ field, ...props }) => (
  <MultiDiagnosisSelector
    name={field.name}
    value={field.value || []}
    onChange={field.onChange}
    {...props}
  />
);
