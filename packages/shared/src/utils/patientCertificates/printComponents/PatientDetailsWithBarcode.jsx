import React from 'react';
import { DataSection } from './DataSection';
import { View } from '@react-pdf/renderer';
import { P } from '../Typography';
import { Col } from '../Layout';
import { getDOBWithAge, getPatientWeight, getSex, getVillageName } from '../../patientAccessors';
import { PrintableBarcode } from './PrintableBarcode';
import { renderDataItems } from './renderDataItems';

export const PatientDetailsWithBarcode = ({ patient, getLocalisation }) => {
  const PATIENT_FIELDS = {
    leftCol: [
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'dateOfBirth', label: 'DOB', accessor: getDOBWithAge },
      { key: 'sex', label: 'Sex', accessor: getSex },
      { key: 'villageName', label: 'Village', accessor: getVillageName },
    ],
    rightCol: [
      ...(patient.patientWeight !== undefined
        ? [
            {
              key: 'patientWeight',
              label: 'Patient weight',
              accessor: data => getPatientWeight(data, getLocalisation),
            },
          ]
        : []),
      { key: 'displayId', label: 'Patient ID' },
    ],
  };

  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getLocalisation)}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, getLocalisation)}
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
