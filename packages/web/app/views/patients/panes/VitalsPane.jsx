import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VitalsTable } from '../../../components/VitalsTable';
import { FormModal, NoteModalActionBlocker, TableButtonRow } from '../../../components';
import { TabPane } from '../components';
import { useApi } from '../../../api';
import { VitalsForm } from '../../../forms';
import { getAnswersFromData, Button, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { VitalChartDataProvider } from '../../../contexts/VitalChartData';
import { VitalChartsModal } from '../../../components/VitalChartsModal';
import { useAuth } from '../../../contexts/Auth';

export const VitalsPane = React.memo(({ patient, encounter, readonly }) => {
  const { facilityId } = useAuth();
  const queryClient = useQueryClient();
  const { getCurrentDateTime } = useDateTime();
  const api = useApi();
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime] = useState(getCurrentDateTime());

  const handleClose = () => setModalOpen(false);

  const submitVitals = async ({ survey, ...data }) => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      encounterId: encounter.id,
      facilityId,
      endTime: getCurrentDateTime(),
      answers: await getAnswersFromData(data, survey),
    });
    queryClient.invalidateQueries(['encounterVitals', encounter.id]);
    handleClose();
  };

  return (
    <TabPane data-testid="tabpane-op0v">
      <VitalChartDataProvider data-testid="vitalchartdataprovider-bmi9">
        <FormModal
          title={
            <TranslatedText
              stringId="encounter.vitals.modal.recordVitals.title"
              fallback="Record vitals"
              data-testid="translatedtext-clah"
            />
          }
          open={modalOpen}
          onClose={handleClose}
          data-testid="formmodal-nzft"
        >
          <VitalsForm
            onClose={handleClose}
            onSubmit={submitVitals}
            patient={patient}
            data-testid="vitalsform-dsuf"
          />
        </FormModal>
        <VitalChartsModal data-testid="vitalchartsmodal-atry" />
        <TableButtonRow variant="small" data-testid="tablebuttonrow-60ze">
          <NoteModalActionBlocker>
            <Button
              onClick={() => setModalOpen(true)}
              disabled={readonly}
              data-testid="button-mk5r"
            >
              <TranslatedText
                stringId="encounter.vitals.action.recordVitals"
                fallback="Record vitals"
                data-testid="translatedtext-odq2"
              />
            </Button>
          </NoteModalActionBlocker>
        </TableButtonRow>
        <VitalsTable data-testid="vitalstable-syw0" />
      </VitalChartDataProvider>
    </TabPane>
  );
});
