import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { VACCINE_STATUS } from 'shared/constants';
import { Modal } from './Modal';
import { ContentPane } from './ContentPane';
import { TextInput } from './Field';
import { FormGrid } from './FormGrid';

export const ViewAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  if (!vaccineRecord) return null;

  const {
    status,
    injectionSite,
    scheduledVaccine: { label, schedule },
    recorder,
    givenBy,
    location,
    encounter,
  } = vaccineRecord;

  return (
    <Modal title="View Vaccination Record" open={open} onClose={onClose}>
      <ContentPane>
        <FormGrid columns={2}>
          <TextInput disabled value={`${label} (${schedule})`} label="Vaccine" />
          <TextInput disabled value={status} label="Status" />
          <TextInput disabled value={location?.locationGroup?.name} label="Area" />
          <TextInput
            disabled
            value={location?.name || encounter?.location?.name}
            label="Location"
          />
          <TextInput disabled value={injectionSite} label="Injection site" />
          {givenBy && <TextInput disabled value={givenBy} label="Giver" />}
          <TextInput
            disabled
            value={recorder?.displayName || encounter?.examiner?.displayName}
            label="Recorder"
          />
        </FormGrid>
      </ContentPane>
    </Modal>
  );
};
