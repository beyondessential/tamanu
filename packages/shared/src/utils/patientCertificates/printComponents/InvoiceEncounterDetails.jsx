import React from 'react';
import { View } from '@react-pdf/renderer';
import { DIAGNOSIS_CERTAINTY } from '@tamanu/constants';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col, Row } from '../Layout';
import { HorizontalRule } from './HorizontalRule';
import { useLanguageContext } from '../../pdf/languageContext';
import { formatShort as baseFormatShort } from '@tamanu/utils/dateTime';
import { P } from '../Typography';

export const InvoiceEncounterDetails = ({ encounter, formatShort = baseFormatShort }) => {
  const { location, department, startDate, endDate, diagnoses } = encounter || {};
  const { getTranslation } = useLanguageContext();

  const filterAndSortDiagnoses = (isPrimary) =>
    diagnoses
      .filter((diagnosis) => diagnosis.isPrimary === isPrimary)
      .filter(({ certainty }) => certainty === DIAGNOSIS_CERTAINTY.CONFIRMED)
      .sort((a, b) => a.diagnosis.name.localeCompare(b.diagnosis.name));

  const primaryDiagnoses = filterAndSortDiagnoses(true);
  const secondaryDiagnoses = filterAndSortDiagnoses(false);

  return (
    <>
      <DataSection
        title={getTranslation('pdf.encounterDetails.title', 'Encounter details')}
        hideBottomRule
      >
        <Col>
          <DataItem
            label={getTranslation('general.localisedField.facility.label', 'Facility')}
            value={location?.facility?.name}
          />
          <DataItem
            label={getTranslation('encounter.admissionDate.label', 'Admission date')}
            value={formatShort(startDate)}
          />
          <DataItem
            label={getTranslation('encounter.dischargeDate.label', 'Discharge date')}
            value={formatShort(endDate)}
          />
        </Col>
        <Col>
          <DataItem
            label={getTranslation('general.department.label', 'Department')}
            value={department?.name}
          />
          <DataItem
            label={getTranslation('general.localisedField.location.label', 'Location')}
            value={getLocationName(encounter)}
          />
        </Col>
      </DataSection>
      {!!diagnoses?.length && <HorizontalRule width="1px" />}
      {!!primaryDiagnoses?.length && (
        <Row>
          <P style={{ marginVertical: 3, marginRight: 12.5 }} bold fontSize={9}>
            {getTranslation('encounter.primaryDiagnoses.label', 'Primary diagnoses')}:{' '}
          </P>
          <View style={{ marginVertical: 3 }}>
            {primaryDiagnoses.map((diagnosis) => (
              <P key={diagnosis.id} style={{ marginVertical: 0 }} fontSize={9}>
                {diagnosis.diagnosis.name}
              </P>
            ))}
          </View>
        </Row>
      )}
      {!!secondaryDiagnoses?.length && (
        <Row>
          <P style={{ marginVertical: 3 }} bold fontSize={9}>
            {getTranslation('encounter.secondaryDiagnoses.label', 'Secondary diagnoses')}:{' '}
          </P>
          <View style={{ marginVertical: 3 }}>
            {secondaryDiagnoses.map((diagnosis) => (
              <P key={diagnosis.id} style={{ marginVertical: 0 }} fontSize={9}>
                {diagnosis.diagnosis.name}
              </P>
            ))}
          </View>
        </Row>
      )}
      <HorizontalRule width="2px" />
    </>
  );
};
