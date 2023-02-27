import React, { useState } from 'react';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import {
  ConfirmCancelRow,
  FormGrid,
  Modal,
  DateTimeInput,
  SuggesterSelectField,
} from '../../../components';

export const LabRequestRecordSampleModal = React.memo(
  ({ updateLabReq, labRequest, open, onClose }) => {
    const [sampleTime, setSampleTime] = useState(labRequest.sampleTime);
    const [labSampleSiteId, setLabSampleSiteId] = useState(labRequest.labSampleSiteId);

    const updateLabStatus = async () => {
      await updateLabReq({
        sampleTime,
        labSampleSiteId,
        ...(labRequest.status === LAB_REQUEST_STATUSES.NOT_COLLECTED && {
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          specimenCollected: true,
        }),
      });
      onClose();
    };

    return (
      <>
        <Modal
          open={open}
          onClose={onClose}
          title={sampleTime ? 'Edit sample date and time' : 'Record sample'}
        >
          <FormGrid columns={1}>
            <DateTimeInput
              label="Sample date & time"
              name="sampleTime"
              required
              value={sampleTime}
              onChange={({ target: { value } }) => setSampleTime(value)}
            />
            <SuggesterSelectField
              label="Site"
              name="labSampleSiteId"
              field={{
                value: labSampleSiteId,
                onChange: ({ target: { value } }) => setLabSampleSiteId(value),
              }}
              endpoint="labSampleSite"
            />
            <ConfirmCancelRow
              onConfirm={updateLabStatus}
              confirmText="Comfirm"
              onCancel={onClose}
            />
          </FormGrid>
        </Modal>
      </>
    );
  },
);
