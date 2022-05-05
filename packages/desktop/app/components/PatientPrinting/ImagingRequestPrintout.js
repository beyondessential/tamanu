import React, { useEffect, useState } from 'react';
import moment from 'moment';

import { useApi } from '../../api';
import { SimplePrintout } from './SimplePrintout';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, certificateData }) => {
    const api = useApi();
    const [notes, setNotes] = useState([]);
    const [encounter, setEncounter] = useState([]);

    const {
      id,
      requestedDate,
      locationId,
      requestedBy,
      urgent,
      imagingType,
      areaToBeImaged,
    } = imagingRequestData;

    useEffect(() => {
      (async () => {
        const res = await api.get(`imagingRequest/${imagingRequestData.id}/notes`);
        setNotes(res.data);
      })();
    }, [api, imagingRequestData.id]);

    useEffect(() => {
      (async () => {
        const res = await api.get(`encounter/${imagingRequestData.encounterId}`);
        setEncounter(res);
      })();
    }, [api, imagingRequestData.encounterId]);

    return (
      <SimplePrintout
        patientData={patientData}
        notes={notes}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request code': id,
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
          Facility: locationId,
          Department: encounter.department?.name,
          'Requested by': requestedBy?.name,
          Urgent: urgent ? 'Yes' : 'No',
          'Request type': imagingType?.name,
          'Area to be imaged': areaToBeImaged,
        }}
      />
    );
  },
);
