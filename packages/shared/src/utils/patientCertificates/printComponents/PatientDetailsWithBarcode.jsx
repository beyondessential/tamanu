import React from 'react';
import { DataSection } from './DataSection';
import { View } from '@react-pdf/renderer';
import { P } from '../Typography';
import { Col } from '../Layout';
import { getDOBWithAge, getSex, getVillageName } from '../../patientAccessors';
import { PrintableBarcode } from './PrintableBarcode';
import { renderDataItems } from './renderDataItems';

const PATIENT_FIELDS = {
  leftCol: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'dateOfBirth', label: 'DOB', accessor: getDOBWithAge },
    { key: 'sex', label: 'Sex', accessor: getSex },
    { key: 'villageName', label: 'Village', accessor: getVillageName },
  ],
  rightCol: [{ key: 'displayId', label: 'Patient ID' }],
};

export const PatientDetailsWithBarcode = ({ patient, getSetting }) => {
  return (
    <DataSection title="Patient details">
      <Col>{renderDataItems(PATIENT_FIELDS.leftCol, patient, getSetting)}</Col>
      <Col>
        {renderDataItems(PATIENT_FIELDS.rightCol, patient, getSetting)}
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
