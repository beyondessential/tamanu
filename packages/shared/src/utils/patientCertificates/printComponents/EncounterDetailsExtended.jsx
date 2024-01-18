import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { DataItem } from './DataItem';
import React from 'react';
import { getDisplayDate } from '../getDisplayDate';

export const EncounterDetailsExtended = ({ encounter }) => {
  // const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const {
    location,
    examiner,
    discharge,
    department,
    startDate,
    endDate,
    reasonForEncounter,
  } = encounter;

  return (
    <DataSection title="Encounter details" hideBottomRule={true}>
      <Col>
        <DataItem label="Facility" value={location.facility.name} key="facility" />
        <DataItem
          // label={`Supervising ${clinicianText}`}
          label="Supervising clinician"
          value={examiner.displayName}
          key="supervisingClinician"
        />
        <DataItem
          // label={`Discharging ${clinicianText}`}
          label="Discharging clinician"
          value={discharge?.discharger?.displayName}
          key="dischargingClinician"
        />
      </Col>
      <Col>
        <DataItem label="Department" value={department.name} key="department" />
        <DataItem label="Date of admission" value={getDisplayDate(startDate)} key="dateOfAdmission" />
        <DataItem label="Date of discharge" value={getDisplayDate(endDate)} key="dateOfDischarge" />
      </Col>
      <DataItem label="Reason for encounter" value={reasonForEncounter} key="reasonForEncounter" />
    </DataSection>
  );
};