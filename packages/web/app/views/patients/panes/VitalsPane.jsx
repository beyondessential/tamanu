import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button, FormModal } from '../../../components';
import { TabPane } from '../components';
import { useApi } from '../../../api';
import { VitalsForm } from '../../../forms';
import { getActionsFromData, getAnswersFromData } from '../../../utils';
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
      actions: getActionsFromData(data, survey),
    });
    queryClient.invalidateQueries(['encounterVitals', encounter.id]);
    handleClose();
  };

  return (
    <TabPane>
      <VitalChartDataProvider>
        <FormModal title="Record vitals" open={modalOpen} onClose={handleClose}>
          <VitalsForm onClose={handleClose} onSubmit={submitVitals} patient={patient} />
        </FormModal>
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
