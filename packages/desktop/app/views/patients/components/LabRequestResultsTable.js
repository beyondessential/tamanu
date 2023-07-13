import React, { useState, useCallback } from 'react';
import { useLabRequest } from '../../../contexts/LabRequest';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { DataFetchingTable, Modal } from '../../../components';
import { ManualLabResultForm } from '../../../forms/ManualLabResultForm';
import { capitaliseFirstLetter } from '../../../utils/capitalise';
import { getCompletedDate, getMethod } from '../../../utils/lab';
import { LabTestResultModal } from '../LabTestResultModal';

const ManualLabResultModal = React.memo(
  ({ labTest, onClose, open, isReadOnly, areLabTestResultsReadOnly }) => {
    const { updateLabTest, labRequest } = useLabRequest();
    const { navigateToLabRequest } = usePatientNavigation();

    const onSubmit = useCallback(
      async ({ result, completedDate, laboratoryOfficer, labTestMethodId, verification }) => {
        await updateLabTest(labRequest.id, labTest.id, {
          result: `${result}`,
          completedDate,
          laboratoryOfficer,
          verification,
          labTestMethodId,
        });
        navigateToLabRequest(labRequest.id);
        onClose();
      },
      [labRequest, labTest, onClose, updateLabTest, navigateToLabRequest],
    );

    if (isReadOnly) {
      return <LabTestResultModal labTestId={labTest?.id} onClose={onClose} open={open} />;
    }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enter result – ${labTest && labTest.labTestType.name} | Test ID ${labRequest &&
        labRequest.displayId}`}
      cornerExitButton={false}
    >
      <ManualLabResultForm
        labTest={labTest}
        onSubmit={onSubmit}
        onClose={onClose}
        title={`Enter result – ${labTest && labTest.labTestType.name} | Test ID ${labRequest &&
          labRequest.displayId}`}
      >
        <ManualLabResultForm
          labTest={labTest}
          onSubmit={onSubmit}
          onClose={onClose}
          isReadOnly={isReadOnly}
          areLabTestResultsReadOnly={areLabTestResultsReadOnly}
        />
      </Modal>
    );
  },
);

const makeRangeStringAccessor = sex => ({ labTestType }) => {
  const max = sex === 'male' ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === 'male' ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = max || max === 0;
  const hasMin = min || min === 0;

  if (hasMin && hasMax) return `${min} - ${max}`;
  if (hasMin) return `>${min}`;
  if (hasMax) return `<${max}`;
  return 'N/A';
};

const columns = sex => [
  { title: 'Test type', key: 'labTestType.name', accessor: row => row.labTestType.name },
  {
    title: 'Result',
    key: 'result',
    accessor: ({ result }) => (result ? capitaliseFirstLetter(result) : ''),
  },
  {
    title: 'Units',
    key: 'labTestType.unit',
    accessor: ({ labTestType }) => labTestType?.unit || '',
  },
  {
    title: 'Reference',
    key: 'reference',
    accessor: makeRangeStringAccessor(sex),
    sortable: false,
  },
  { title: 'Method', key: 'labTestMethod', accessor: getMethod, sortable: false },
  { title: 'Lab officer', key: 'laboratoryOfficer' },
  { title: 'Verification', key: 'verification' },
  { title: 'Completed', key: 'completedDate', accessor: getCompletedDate, sortable: false },
];

export const LabRequestResultsTable = React.memo(
  ({ labRequest, patient, isReadOnly, areLabTestResultsReadOnly }) => {
    const [activeTest, setActiveTest] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);

    const closeModal = () => setModalOpen(false);
    const openModal = test => {
      setActiveTest(test);
      setModalOpen(true);
    };

    const sexAppropriateColumns = columns(patient.sex);

    return (
      <>
        <ManualLabResultModal
          open={isModalOpen}
          labRequest={labRequest}
          labTest={activeTest}
          onClose={closeModal}
          isReadOnly={isReadOnly}
          areLabTestResultsReadOnly={areLabTestResultsReadOnly}
        />
        <DataFetchingTable
          columns={sexAppropriateColumns}
          endpoint={`labRequest/${labRequest.id}/tests`}
          onRowClick={openModal}
          initialSort={{ order: 'asc', orderBy: 'id' }}
          elevated={false}
        />
      </>
    );
  },
);
