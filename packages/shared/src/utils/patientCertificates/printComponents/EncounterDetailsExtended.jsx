import { DataSection } from './DataSection';
import { Col } from '../Layout';
import { DataItem } from './DataItem';
import React from 'react';
import { formatShort as baseFormatShort } from '@tamanu/utils/dateTime';
import { useLanguageContext } from '../../pdf/languageContext';

export const EncounterDetailsExtended = ({ encounter, discharge, formatShort = baseFormatShort }) => {
  const { location, examiner, department, startDate, endDate, reasonForEncounter } = encounter;
  const { getTranslation } = useLanguageContext();

  const clinicianText = getTranslation(
    'general.localisedField.clinician.label.short',
    'Clinician',
    { casing: 'lower' },
  );
  return (
    <DataSection
      title={getTranslation('pdf.encounterDetails.title', 'Encounter details')}
      hideBottomRule={true}
    >
      <Col>
        <DataItem
          label={getTranslation('general.localisedField.facility.label', 'Facility')}
          value={location.facility.name}
          key="facility"
        />
        <DataItem
          label={getTranslation('general.supervisingClinician.label', 'Supervising :clinician', {
            replacements: {
              clinician: clinicianText,
            },
          })}
          value={examiner.displayName}
          key="supervisingClinician"
        />
        <DataItem
          label={getTranslation('general.dischargingClinician.label', 'Discharging :clinician', {
            replacements: {
              clinician: clinicianText,
            },
          })}
          value={discharge?.discharger?.displayName}
          key="dischargingClinician"
        />
        {discharge?.disposition?.name && (
          <DataItem
            label={getTranslation(
              'general.localisedField.dischargeDisposition.label',
              'Discharge disposition',
            )}
            value={discharge?.disposition?.name}
            key="dischargeDisposition"
          />
        )}
      </Col>
      <Col>
        <DataItem
          label={getTranslation('general.department.label', 'Department')}
          value={department.name}
          key="department"
        />
        <DataItem
          label={getTranslation('encounter.dateOfAdmission.label', 'Date of admission')}
          value={formatShort(startDate)}
          key="dateOfAdmission"
        />
        <DataItem
          label={getTranslation('encounter.dateOfDischarge.label', 'Date of discharge')}
          value={
            discharge
              ? formatShort(endDate)
              : getTranslation('general.encounterDischargedNotApplicable', 'n/a (encounter in progress)')
          }
          key="dateOfDischarge"
        />
      </Col>
      <DataItem
        label={getTranslation('encounter.reasonForEncounter.label', 'Reason for encounter')}
        value={reasonForEncounter}
        key="reasonForEncounter"
      />
    </DataSection>
  );
};
