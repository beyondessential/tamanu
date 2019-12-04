import React from 'react';
import { Button } from './Button';
import { AutocompleteInput } from './Field/AutocompleteField';

const DiagnosisList = ({ diagnoses, onRemove }) => (
  <ul>
    { diagnoses.map(d => (<li key={d._id} onClick={() => onRemove(d._id)}>{d.name}</li>)) }
  </ul>
);

export const MultiDiagnosisSelector = React.memo(({ value, limit=5, onChange, icd10Suggester }) => {
  const [selectedDiagnosisId, setSelectedDiagnosisId] = React.useState(null);

  const onDiagnosisChange = React.useCallback(({ target }) => {
    setSelectedDiagnosisId(target.value);
  }, [setSelectedDiagnosisId]);

  const onAdd = React.useCallback(() => {
    if(selectedDiagnosisId) {
      setSelectedDiagnosisId("");

      (async () => {
        const diagnosis = { 
          _id: selectedDiagnosisId, 
          name: await icd10Suggester.fetchCurrentOption(selectedDiagnosisId).label,
        };
        onChange([...value, diagnosis]);
      })();
    }
  }, [value, selectedDiagnosisId, setSelectedDiagnosisId]);

  const onRemove = React.useCallback((id) => {
    const newValues = value.filter(x => x._id !== id);
    onChange(newValues);
  });

  // This will change when an item is added. Using it as the key for the autocomplete
  // will create and mount it anew. Otherwise it'll preserve its own state, meaning the user
  // will have to delete the old value from the field to be able to add another one.
  const autocompleteForceRerender = (value || []).length;

  return (
    <div>
      <DiagnosisList 
        diagnoses={value || []} 
        onRemove={onRemove}
      />
      <AutocompleteInput
        key={autocompleteForceRerender}
        suggester={icd10Suggester}
        value={selectedDiagnosisId}
        onChange={onDiagnosisChange} 
      />
      <Button 
        variant="contained"
        onClick={onAdd}
        disabled={value.length >= limit}
      >Add</Button>
    </div>
  );
});
