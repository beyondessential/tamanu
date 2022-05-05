import React, { useEffect, useState } from 'react';
import moment from 'moment';

import { useApi } from '../../api';
import { SimplePrintout } from './SimplePrintout';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, certificateData }) => {
    const api = useApi();
    const [encounter, setEncounter] = useState();

    const {
      id,
      requestedDate,
      requestedBy,
      urgent,
      imagingType,
      areaToBeImaged,
      note,
    } = imagingRequestData;

    useEffect(() => {
      (async () => {
        const res = await api.get(`encounter/${imagingRequestData.encounterId}`);
        setEncounter(res);
      })();
    }, [api, imagingRequestData.encounterId]);

    return (
      <SimplePrintout
        patientData={patientData}
        notes={[{ content: note }]}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request code': id,
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
          Facility: '', // TODO: Where does this field come from?
          Department: encounter.department?.name,
          'Requested by': requestedBy?.displayName,
          Urgent: urgent ? 'Yes' : 'No',
          'Request type': imagingType?.name,
          'Area to be imaged': areaToBeImaged,
        }}
      />
    );
  },
);
