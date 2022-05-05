import React, { useEffect, useState } from 'react';
import moment from 'moment';

import { useApi } from '../../api';
import { SimplePrintout } from './SimplePrintout';

export const LabRequestPrintout = React.memo(({ labRequestData, patientData, certificateData }) => {
  const api = useApi();
  const [notes, setNotes] = useState([]);

  const [tests, setTests] = useState([]);
  const [encounter, setEncounter] = useState([]);
  const {
    displayId,
    requestedDate,
    sampleTime,
    laboratory,
    requestedBy,
    priority,
    category,
  } = labRequestData;

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequestData.id}/tests`);
      setTests(res.data);
    })();
  }, [api, labRequestData.id]);

  useEffect(() => {
    (async () => {
      const res = await api.get(`encounter/${labRequestData.encounterId}`);
      setEncounter(res);
    })();
  }, [api, labRequestData.encounterId]);

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequestData.id}/notes`);
      setNotes(res.data);
    })();
  }, [api, labRequestData.id]);

  return (
    <SimplePrintout
      patientData={patientData}
      notes={notes}
      certificateData={{ ...certificateData, pageTitle: 'Lab Request' }}
      tableData={{
        'Request number': displayId,
        'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
        Facility: laboratory?.name,
        Department: encounter.department?.name,
        'Requested by': requestedBy?.displayName,
        'Sample time': sampleTime ? moment(sampleTime).format('DD/MM/YYYY hh:mm a') : null,
        Priority: priority?.name,
        'Test type': category?.name,
        'Test requested': tests.map(test => test.labTestType?.name).join(', '),
      }}
    />
  );
});
