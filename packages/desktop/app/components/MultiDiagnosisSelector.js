import React from 'react';
import { Button } from './Button';
import { AutocompleteInput } from './Field/AutocompleteField';

const DiagnosisList = ({ diagnoses }) => (
  <ul>
    { diagnoses.map(d => (<li key={d._id}>{JSON.stringify(d)}</li>)) }
  </ul>
);

export const MultiDiagnosisSelector = React.memo(({ value, onChange, icd10Suggester }) => {
  const [selectedDiagnosis, setSelectedDiagnosis] = React.useState(null);

  const onDiagnosisChange = React.useCallback(({ target }) => {
    console.log(target.value);
    setSelectedDiagnosis(target.value);
  }, [setSelectedDiagnosis]);

  const onAdd = React.useCallback(() => {
    if(selectedDiagnosis) {
      onChange([...value, selectedDiagnosis]);
      setSelectedDiagnosis("");
    }
  }, [value, selectedDiagnosis]);

  return (
    <div>
      <DiagnosisList diagnoses={value || []} />
      <AutocompleteInput
        suggester={icd10Suggester}
        value={selectedDiagnosis}
        onChange={onDiagnosisChange} 
      />
      <Button variant="contained" onClick={onAdd}>Add</Button>
    </div>
  );
});
