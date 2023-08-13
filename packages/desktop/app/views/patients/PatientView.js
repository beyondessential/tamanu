import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';

export const PatientView = () => {
  const patient = useSelector(state => state.patient);
  const api = useApi();

  useEffect(() => {
    api.post(`user/recently-viewed-patients/${patient.id}`);
  }, [api, patient.id]);

  if (patient.loading) {
    return <LoadingIndicator />;
  }

  return (
    <div style={{ padding: '10%' }}>
      <h1 style={{ fontSize: '72px' }}>
        This is tamanu debug, only perform actions on test patients!
      </h1>
    </div>
  );
};
