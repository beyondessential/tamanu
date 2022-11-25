import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button, Modal, Form, ConfirmCancelRow } from '../../../components';
import { TabPane } from '../components';
import { useApi } from '../../../api';
import { SurveyScreen } from '../../../components/Surveys/SurveyScreen';

const VitalsForm = ({ onClose, patient, encounterId, survey }) => {
  const queryClient = useQueryClient();
  const api = useApi();

  const submitVitals = async data => {
    console.log('submit vitals', data);
    await api.post(`vitals`, { ...data, encounterId });
    queryClient.invalidateQueries(['encounterVitals', encounterId]);
    onClose();
  };

  const { components } = survey;

  return (
    <Form
      onSubmit={submitVitals}
      render={({ submitForm }) => {
        return (
          <SurveyScreen
            components={components}
            patient={patient}
            cols={2}
            submitButton={
              <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onClose} />
            }
          />
        );
      }}
    />
  );
};

// Todo: update survey id
const VITALS_SURVEY_ID = 'program-patientvitals-patientvitals';

// Todo: make generic for surveys
const useVitalsSurvey = () => {
  const api = useApi();

  return useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/${encodeURIComponent(VITALS_SURVEY_ID)}`),
  );
};

export const VitalsPane = React.memo(({ patient, encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  // const [startTime, setStartTime] = useState(null);
  const { data: survey, isLoading } = useVitalsSurvey();

  const handleClose = () => setModalOpen(false);

  if (isLoading) {
    return 'Loading...';
  }

  return (
    <TabPane>
      <Modal title="Record vitals" open={modalOpen} onClose={handleClose}>
        <VitalsForm
          encounterId={encounter.id}
          onClose={handleClose}
          patient={patient}
          survey={survey}
        />
      </Modal>
      <TableButtonRow variant="small">
        <Button onClick={() => setModalOpen(true)} disabled={readonly}>
          Record vitals
        </Button>
      </TableButtonRow>
      <VitalsTable />
    </TabPane>
  );
});
