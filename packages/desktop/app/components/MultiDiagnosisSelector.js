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

const DiagnosisItem = React.memo(({ diagnosis, onRemove }) => {
  return (
    <li>
      (<a onClick={() => onRemove(diagnosis._id)}>x</a>)
      <span> {diagnosis.name}</span>
    </li>
  );
});

const DiagnosisList = ({ diagnoses, onRemove }) => {
  const listContents =
    diagnoses.length > 0 ? (
      diagnoses.map(d => (
        <DiagnosisItem key={d._id} onRemove={onRemove} diagnosis={d} />
      ))
    ) : (
      <li>No diagnoses selected</li>
    );
  return <ul>{listContents}</ul>;
};

export const MultiDiagnosisSelector = React.memo(
  ({ value, limit = 5, onChange, icd10Suggester, name }) => {
    const [selectedDiagnosisId, setSelectedDiagnosisId] = React.useState(null);

    const updateValue = (newValue) => {
      onChange({ target: { value: newValue, name } });
    };

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
          updateValue([...value, diagnosis]);
        })();
      }
    }, [value, selectedDiagnosisId, setSelectedDiagnosisId]);

    const onRemove = React.useCallback(id => {
      const newValues = value.filter(x => x._id !== id);
      updateValue(newValues);
    });

    // This will change when an item is added. Using it as the key for the autocomplete
    // will create and mount it anew. Otherwise it'll preserve its own state, meaning the user
    // will have to delete the old value from the field to be able to add another one.
    const autocompleteForceRerender = (value || []).length;

    return (
      <div>
        <AdderContainer>
          <AutocompleteInput
            key={autocompleteForceRerender}
            suggester={icd10Suggester}
            value={selectedDiagnosisId}
            onChange={onDiagnosisChange}
            label="Select diagnosis"
          />
          <Button variant="contained" onClick={onAdd} disabled={value.length >= limit}>
            Add
          </Button>
        </AdderContainer>
        <DiagnosisList diagnoses={value || []} onRemove={onRemove} />
      </div>
    );
  },
);

export const MultiDiagnosisSelectorField = ({ field, ...props }) => (
  <MultiDiagnosisSelector name={field.name} value={field.value || []} onChange={field.onChange} {...props} />
);
