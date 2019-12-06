import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { AutocompleteInput } from './Field/AutocompleteField';

const AdderContainer = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: auto min-content;
  align-items: end;
`;

const DiagnosisItem = React.memo(({ diagnosis, onRemove }) => (
  <li>
    (<a onClick={() => onRemove(diagnosis._id)}>x</a>)
    <span> {diagnosis.name}</span>
  </li>
));

const DiagnosisList = ({ diagnoses, onRemove }) => {
  const listContents =
    diagnoses.length > 0 ? (
      diagnoses.map(d => <DiagnosisItem key={d._id} onRemove={onRemove} diagnosis={d} />)
    ) : (
      <li>No diagnoses selected</li>
    );
  return <ul>{listContents}</ul>;
};

export const MultiDiagnosisSelector = React.memo(
  ({ value, limit = 5, onChange, icd10Suggester, name }) => {
    const selectedDiagnoses = value || [];
    const [selectedDiagnosisId, setSelectedDiagnosisId] = React.useState(null);

    const updateValue = React.useCallback(newValue => {
      onChange({ target: { value: newValue, name } });
    }, [name]);

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
            _id: selectedDiagnosisId,
            name: await icd10Suggester.fetchCurrentOption(selectedDiagnosisId).label,
          };
          updateValue([...selectedDiagnoses, diagnosis]);
        })();
      }
    }, [selectedDiagnoses, selectedDiagnosisId, setSelectedDiagnosisId, updateValue]);

    const onRemove = React.useCallback(id => {
      const newValues = selectedDiagnoses.filter(x => x._id !== id);
      updateValue(newValues);
    }, [selectedDiagnoses, updateValue]);

    // This forces the autocomplete component to clear when the user hits add.
    // (when the key changes, React treats it as an instruction to destroy the old 
    // component, and add a new unrelated component in its place with fresh state)
    const autocompleteForceRerender = selectedDiagnoses.length;

    return (
      <React.Fragment>
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
      </React.Fragment>
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
