import React from 'react';
import { Button } from './Button';
import { AutocompleteInput } from './Field/AutocompleteField';

const DiagnosisList = ({ diagnoses }) => (
  <ul>
    { diagnoses.map(d => (<li key={d._id}>{d.name}</li>)) }
  </ul>
);

export const MultiDiagnosisSelector = React.memo(({ value, limit=5, onChange, icd10Suggester }) => {
  const [selectedDiagnosisId, setSelectedDiagnosisId] = React.useState(null);

  const onDiagnosisChange = React.useCallback(({ target }) => {
    setSelectedDiagnosisId(target.value);
  }, [setSelectedDiagnosisId]);

  const onAdd = React.useCallback(() => {
    if(selectedDiagnosisId) {
      const diagnosis = { _id: selectedDiagnosisId, name: "DDD:" + selectedDiagnosisId };

      onChange([...value, diagnosis]);
      setSelectedDiagnosisId("");
    }
  }, [value, selectedDiagnosisId, setSelectedDiagnosisId]);

  return (
    <div>
      <DiagnosisList diagnoses={value || []} />
      <AutocompleteInput
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
