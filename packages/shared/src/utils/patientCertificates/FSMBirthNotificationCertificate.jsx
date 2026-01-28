import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { Watermark } from './Layout';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  SEX_OPTIONS,
} from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { getEthnicity } from '../patientAccessors';
import { useLanguageContext } from '../pdf/languageContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
  },
  table: {
    border: '1 solid black',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
  },
  lastRow: {
    flexDirection: 'row',
  },
  cell: {
    height: 36,
    borderRight: '1 solid black',
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 9,
    marginBottom: 2,
    color: '#333',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  governmentBox: {
    fontSize: 10,
    width: '14%',
    padding: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sealBox: {
    fontSize: 10,
    width: '14%',
    padding: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titleBox: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderBottom: '1 solid black',
    padding: 5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionLabel: {
    width: '6%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#eee',
    borderRight: '1 solid black',
    padding: 4,
  },
  sectionContent: {
    flex: 1,
    flexDirection: 'column',
  },
});

const Cell = ({ label, value, style, width, flex, lastCell = false, hideValue = false }) => (
  <View style={[styles.cell, style, width ? { width } : {}, flex ? { flex } : {}, lastCell ? { borderRight: 0 } : {}]}>
    {label && <Text bold style={styles.label}>{label}</Text>}
    {hideValue ? null : <Text style={styles.value}>{value || ' '}</Text>}
  </View>
);

const getLabelFromValue = (mapping, v) => {
  const entry = mapping.find(e => e.value === v);
  return entry ? entry.label : '';
};

const getFullName = (patient) => {
  if (!patient) return '';
  // Simple split logic if we don't have separate fields, 
  // but here we just return full name for the "First name" field 
  // and leave others blank if we can't parse easily, or put it all in First.
  // Ideally we would split but names are complex. 
  // For this form, let's put the whole name in First Name or spread it if we want.
  // But to be safe, let's just use the helper which returns combined.
  return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`;
};

// Helper to extract name parts if possible, otherwise returns full string in first
const getNameParts = (patient) => {
  if (!patient) return { first: '', middle: '', last: '' };
  return {
    first: patient.firstName || '',
    middle: '', // We don't have a distinct middle name field in standard patient object usually
    last: patient.lastName || '',
  };
};

export const FSMBirthNotificationCertificate = ({
  motherData,
  fatherData,
  childData,
  facility,
}) => {
  const childName = getNameParts(childData);
  const motherName = getNameParts(motherData);
  const fatherName = getNameParts(fatherData);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.table}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <View style={[styles.sectionLabel, styles.governmentBox]}>
              <Text bold>GOVERNMENT</Text>
            </View>
            <View style={[styles.titleBox]}>
              <Text bold style={styles.headerTitle}>CERTIFICATE OF LIVE BIRTH</Text>
              <Text bold style={styles.headerSubtitle}>FEDERATED STATES OF MICRONESIA</Text>
            </View>
          </View>
          
          {/* Row 2: Court Info */}
          <View style={styles.row}>
            <View style={[styles.sectionLabel, styles.sealBox]}>
              <Text bold>SEAL</Text>
            </View>
            <Cell flex={1} label="State court file no.:" value="" />
            <Cell flex={1} label="Date:" value="" />
            <Cell flex={1} label="Medical record no:" value="" lastCell />
          </View>

          {/* Child Section */}
          <View style={styles.row}>
            <View style={styles.sectionLabel}>
              <Text bold>Child</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {/* Child Row 1 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell flex={1} label="First name:" value={childName.first} />
                <Cell flex={1} label="Middle name:" value={childName.middle} />
                <Cell flex={1} label="Last name:" value={childName.last} />
                <Cell width="25%" style={{ borderRight: 0 }} label="Plurality:" value={getLabelFromValue(BIRTH_TYPE_OPTIONS, childData?.birthData?.birthType)} />
              </View>
              
              {/* Child Row 2 */}
              <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                <Cell width="20%" label="Date of birth:" value={childData?.dateOfBirth ? getDisplayDate(childData?.dateOfBirth) : ''} />
                <Cell width="15%" label="Sex:" value={getLabelFromValue(SEX_OPTIONS, childData?.sex)} />
                <Cell width="20%" label="Delivery site:" value={facility?.name || getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, childData?.birthData?.registeredBirthPlace)} />
                <Cell width="20%" label="Attendant:" value={childData?.birthData?.nameOfAttendantAtBirth} />
                <Cell width="25%" style={{ borderRight: 0 }} label="Birth order:" value="" />
               </View>
            </View>
          </View>

           {/* Mother Section */}
           <View style={[styles.row]}>
            <View style={styles.sectionLabel}>
              <Text bold>Mother</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {/* Mother Row 1 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell flex={1} label="Maiden name (First):" value={motherName.first} />
                <Cell flex={1} label="Middle name:" value={motherName.middle} />
                <Cell flex={1} label="Last name:" value={motherName.last} />
                <Cell width="25%" style={{ borderRight: 0 }} label="Birthdate:" value={motherData?.dateOfBirth ? getDisplayDate(motherData?.dateOfBirth) : ''} />
              </View>
              
              {/* Mother Row 2 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell width="20%" label="FSM birth state or country:" value={motherData?.additionalData?.nationality?.name} />
                <Cell width="15%" label="Village:" value={motherData?.village?.name} />
                <Cell width="20%" label="Municipality:" value="" />
                <Cell width="20%" label="State (legal residence):" value="" />
                <Cell width="25%" style={{ borderRight: 0 }} label="Medical record number:" value={motherData?.displayId} />
              </View>

              {/* Mother Row 3 */}
              <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell flex={1} label="Race:" value={getEthnicity(motherData)} />
                 <Cell flex={1} label="Highest grade:" value="" />
                 <Cell flex={1} label="Occupation:" value={motherData?.occupation?.name} />
                 <Cell width="25%" style={{ borderRight: 0 }} label="Marital status:" value={getLabelFromValue(MARITAL_STATUS_OPTIONS, motherData?.additionalData?.maritalStatus)} />
               </View>
            </View>
          </View>

          {/* Father Section */}
          <View style={[styles.row]}>
            <View style={styles.sectionLabel}>
              <Text bold>Father</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {/* Father Row 1 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell flex={1} label="First name:" value={fatherName.first} />
                <Cell flex={1} label="Middle name:" value={fatherName.middle} />
                <Cell flex={1} label="Last name:" value={fatherName.last} />
                <Cell width="25%" style={{ borderRight: 0 }} label="Birthdate:" value={fatherData?.dateOfBirth ? getDisplayDate(fatherData?.dateOfBirth) : ''} />
              </View>
              
              {/* Father Row 2 */}
              <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell flex={1} label="Race:" value={getEthnicity(fatherData)} />
                 <Cell flex={1} label="Highest grade:" value="" />
                 <Cell flex={1} label="Occupation:" value={fatherData?.occupation?.name} />
                 <Cell width="25%" style={{ borderRight: 0 }} label="FSM birth state or country:" value={fatherData?.additionalData?.nationality?.name} />
               </View>
            </View>
          </View>

          {/* Certifier Section */}
          <View style={[styles.lastRow]}>
            <View style={styles.sectionLabel}>
              <Text bold>Certifier</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {/* Cert Row 1 */}
              <View style={[styles.row, { borderLeft: 0 }]}>
                <Cell style={{ backgroundColor: '#eee' }} flex={1} label="I certify that the above named child was born alive at the place and the date specified above" value=""/>
                <Cell width="25%" label="Informant:" value="" lastCell />
              </View>
              
              {/* Cert Row 2 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell flex={1} label="Certifier name:" value={childData?.birthData?.nameOfAttendantAtBirth} />
                <Cell flex={1} label="Signature:" value="" />
                <Cell width="20%" label="Date signed:" value="" />
                <Cell width="25%" style={{ borderRight: 0 }} label="Mother/Father agrees to NAME spelling (signatures)" value="" />
              </View>

              {/* Cert Row 3 */}
              <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                <Cell style={{ backgroundColor: '#eee' }} width="24%" label="I certify that I reviewed this certificate for completeness and accuracy" hideValue />
                <Cell width="29%" label="Name of Director of Health Services or Designee:" value="" />
                <Cell width="22%" label="Signature:" value="" />
                <Cell width="25%" style={{ borderRight: 0 }} label="Date signed:" value="" />
              </View>

              {/* Cert Row 4 */}
              <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                <Cell flex={1} label="Certifier name (Chief Clerk of Court):" value="" />
                <Cell flex={1} label="Signature of Chief Clerk of Court:" value="" />
                <Cell width="25%" style={{ borderRight: 0 }} label="Date received by Clerk of Courts:" value="" />
              </View>
            </View>
          </View>
        </View>

         {/* Footer / Print date */}
         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, padding: 2, borderTop: '1 solid #DEDEDE' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text bold style={{ fontSize: 8, color: '#888' }}>Print date: </Text>
              <Text style={{ fontSize: 8, color: '#888' }}>{getCurrentDateString()} | </Text>
              <Text bold style={{ fontSize: 8, color: '#888' }}>Printed by: </Text>
              <Text style={{ fontSize: 8, color: '#888' }}>Initial Admin</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 8, color: '#888' }}>1 of 1</Text>
            </View>
         </View>
      </Page>
    </Document>
  );
};
