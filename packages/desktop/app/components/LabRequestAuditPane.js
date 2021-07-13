import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '../api';
// STATUS (LAB_STATUS[labRequest.status]) | Date/time (of update) | Officer (current user)
const LabRequestAuditPane = ({ labRequest }) => {
  const api = useApi();
  const [logs, setLogs] = useState([]);
  // const saveDiagnosis = useCallback(async data => {
  //   await onSaveDiagnosis(data);
  //   await loadEncounter(encounterId);
  //   onClose();
  // }, []);
  // useEffect(() => {
  //   (async () => {
  //     const programList = await fetchPrograms();
  //     setPrograms(programList);
  //   })();
  // }, []); // [] means it will run only once, on first mount

  useEffect(() => {
    (async () => {
      const res = api.get('labRequestLog', {});
      
    })();
  }, []);

  return (
    <div>
      <p>ok</p>
    </div>
  );
};
