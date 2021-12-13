import React from 'react';

import { AppointmentModal } from '../../../components/AppointmentModal';
import { AppointmentTable } from '../../../components/AppointmentTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';

export const AppointmentPane = React.memo(({ patient, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <AppointmentModal
        open={modalOpen}
        patientId={patient.id}
        onClose={() => setModalOpen(false)}
      />
      <AppointmentTable appointments={patient.appointments} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New appointment
        </Button>
      </ContentPane>
    </div>
  );
});
