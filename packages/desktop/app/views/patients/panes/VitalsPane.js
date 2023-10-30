import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button, Modal } from '../../../components';
import { TabPane } from '../components';
import { useApi } from '../../../api';
import { VitalsForm } from '../../../forms';
import { getAnswersFromData } from '../../../utils';
import { VitalChartDataProvider } from '../../../contexts/VitalChartData';
import { VitalChartsModal } from '../../../components/VitalChartsModal';

export const VitalsPane = React.memo(({ patient, encounter, readonly }) => {
  const queryClient = useQueryClient();
  const api = useApi();
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime] = useState(getCurrentDateTimeString());

  const handleClose = () => setModalOpen(false);

  const submitVitals = async ({ survey, ...data }) => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      encounterId: encounter.id,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
    });
    queryClient.invalidateQueries(['encounterVitals', encounter.id]);
    handleClose();
  };

  return (
    <TabPane>
      <VitalChartDataProvider>
        <Modal title="Record vitals" open={modalOpen} onClose={handleClose}>
          <VitalsForm onClose={handleClose} onSubmit={submitVitals} patient={patient} />
        </Modal>
        <VitalChartsModal />
        <TableButtonRow variant="small">
          <Button onClick={() => setModalOpen(true)} disabled={readonly}>
            Record vitals
          </Button>
        </TableButtonRow>
        <VitalsTable />
      </VitalChartDataProvider>
    </TabPane>
  );
});
