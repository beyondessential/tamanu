import React from 'react';
import { DataSection } from './DataSection';
import { View } from '@react-pdf/renderer';
import { P } from '../Typography';
import { Col } from '../Layout';
import { getDobWithAge, getPatientWeight, getSex, getVillageName } from '../../patientAccessors';
import { useLanguageContext } from '../../pdf/languageContext';
import { PrintableBarcode } from './PrintableBarcode';
import { renderDataItems } from './renderDataItems';
import { useDateTimeFormat } from '../../pdf/withDateTimeContext';

export const PatientDetailsWithBarcode = ({ patient, getSetting }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTimeFormat();
  const PATIENT_FIELDS = {
    leftCol: [
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'dateOfBirth', label: 'DOB', accessor: getDobWithAge },
      { key: 'sex', label: 'Sex', accessor: getSex },
      { key: 'villageName', label: 'Village', accessor: getVillageName },
    ],
    rightCol: [
      ...(patient.patientWeight !== undefined
        ? [
            {
              key: 'patientWeight',
              label: 'Patient weight',
              accessor: getPatientWeight,
            },
          ]
        : []),
      { key: 'displayId', label: 'Patient ID' },
    ],
  };

  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, { getTranslation, getSetting, formatShort })}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, { getTranslation, getSetting, formatShort })}
        <View style={{ flexDirection: 'row' }}>
          <P style={{ marginTop: 9 }} fontSize={9} bold>
            Patient ID barcode:
          </P>
          <PrintableBarcode id={patient.displayId} />
        </View>
      </Col>
    </DataSection>
  );
};
