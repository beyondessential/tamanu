import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { DataItem } from './DataItem';
import React from 'react';
import { formatShort } from '../../dateTime';

export const EncounterDetailsExtended = ({ encounter, discharge, clinicianText }) => {
  const { location, examiner, department, startDate, endDate, reasonForEncounter } = encounter;

  return (
    <DataSection title="Encounter details" hideBottomRule={true}>
      <Col>
        <DataItem label="Facility" value={location.facility.name} key="facility" />
        <DataItem
          label={`Supervising ${clinicianText.toLowerCase()}`}
          value={examiner.displayName}
          key="supervisingClinician"
        />
        <DataItem
          label={`Discharging ${clinicianText.toLowerCase()}`}
          value={discharge?.discharger?.displayName}
          key="dischargingClinician"
        />
      </Col>
      <Col>
        <DataItem label="Department" value={department.name} key="department" />
        <DataItem
          label="Date of admission"
          value={formatShort(startDate)}
          key="dateOfAdmission"
        />
        <DataItem label="Date of discharge" value={formatShort(endDate)} key="dateOfDischarge" />
      </Col>
      <DataItem label="Reason for encounter" value={reasonForEncounter} key="reasonForEncounter" />
    </DataSection>
  );
};
