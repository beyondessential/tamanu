import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button, Modal } from '../../../components';
import { TabPane } from '../components';
import { useAuth } from '../../../contexts/Auth';
import { useApi } from '../../../api';
import { SurveyView } from '../../programs/SurveyView';

const VitalsForm = ({ onClose, patient, currentUser, encounterId, survey }) => {
  const queryClient = useQueryClient();
  const api = useApi();

  const submitVitals = async data => {
    console.log('submit vitals', data);
    await api.post(`vitals`, { ...data, encounterId });
    queryClient.invalidateQueries(['encounterVitals', encounterId]);
    onClose();
  };

  return (
    <SurveyView
      onSubmit={submitVitals}
      survey={survey}
      onCancel={onClose}
      patient={patient}
      currentUser={currentUser}
    />
  );
};

// Todo: update survey id
const VITALS_SURVEY_ID = 'program-tamanutestforms-tamanudevtestref';

// Todo: make generic for surveys
const useVitalsSurvey = () => {
  const api = useApi();

  return useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/${encodeURIComponent(VITALS_SURVEY_ID)}`),
  );
};

export const VitalsPane = React.memo(({ patient, encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { currentUser } = useAuth();
  // const [startTime, setStartTime] = useState(null);
  const { data: survey, isLoading } = useVitalsSurvey();

  console.log('data', survey);

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
          currentUser={currentUser}
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
