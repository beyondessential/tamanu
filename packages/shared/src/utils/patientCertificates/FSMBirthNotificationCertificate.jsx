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

const LEFT_COL_WIDTH = '12%';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
  },
  table: {
    borderTop: '1 solid black',
    borderLeft: '1 solid black',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
  },
  cell: {
    borderRight: '1 solid black',
    padding: 2,
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 7,
    marginBottom: 2,
    color: '#333',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
    minHeight: 60,
  },
  governmentBox: {
    width: LEFT_COL_WIDTH,
    borderRight: '1 solid black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#eee',
  },
  titleBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRight: '1 solid black',
  },
  sectionLabel: {
    width: LEFT_COL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRight: '1 solid black',
    padding: 2,
  },
  verticalText: {
    transform: 'rotate(-90deg)',
    width: 60,
    textAlign: 'center',
  },
  sectionContent: {
    flex: 1,
    flexDirection: 'column',
  },
});

const Cell = ({ label, value, style, width, flex }) => (
  <View style={[styles.cell, style, width ? { width } : {}, flex ? { flex } : {}]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <Text style={styles.value}>{value || ' '}</Text>
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
  certificateData,
  getSetting,
}) => {
  const { watermark } = certificateData;
  const { getTranslation } = useLanguageContext();
  
  const childName = getNameParts(childData);
  const motherName = getNameParts(motherData);
  const fatherName = getNameParts(fatherData);

  const causeOfDeath =
    childData?.deathData?.causes?.primary?.condition?.name ??
    getTranslation('general.fallback.notApplicable', 'N/A');

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {watermark && <Watermark src={watermark} />}
        
        <View style={styles.table}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <View style={styles.governmentBox}>
              <Text style={{ fontWeight: 'bold' }}>GOVERNMENT</Text>
            </View>
            <View style={[styles.titleBox, { flex: 0, width: '88%' }]}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                 {/* Title Area */}
                 <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>CERTIFICATE OF LIVE BIRTH</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>FEDERATED STATES OF MICRONESIA</Text>
                 </View>
              </View>
            </View>
          </View>
          
          {/* Row 2: Court Info */}
          <View style={styles.row}>
            <View style={[styles.cell, { width: LEFT_COL_WIDTH, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{ fontWeight: 'bold' }}>SEAL</Text>
            </View>
            <Cell width="28%" label="State court file no.:" value="" />
            <Cell width="20%" label="Date:" value="" />
            <Cell width="40%" style={{ borderRight: 0 }} label="Medical record no:" value="" />
          </View>

          {/* Child Section */}
          <View style={styles.row}>
            <View style={styles.sectionLabel}>
               <Text style={{ fontWeight: 'bold' }}>Child</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
               {/* Child Row 1 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <Cell flex={1} label="First name:" value={childName.first} />
                 <Cell flex={1} label="Middle name:" value={childName.middle} />
                 <Cell flex={1} label="Last name:" value={childName.last} />
                 <Cell width="20%" style={{ borderRight: 0 }} label="Plurality:" value={getLabelFromValue(BIRTH_TYPE_OPTIONS, childData?.birthData?.birthType)} />
               </View>
               
               {/* Child Row 2 */}
               <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell width="25%" label="Date of birth:" value={childData?.dateOfBirth ? getDisplayDate(childData?.dateOfBirth) : ''} />
                 <Cell width="15%" label="Sex:" value={getLabelFromValue(SEX_OPTIONS, childData?.sex)} />
                 <Cell width="20%" label="Delivery site:" value={facility?.name || getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, childData?.birthData?.registeredBirthPlace)} />
                 <Cell width="20%" label="Attendant:" value={childData?.birthData?.nameOfAttendantAtBirth} />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Birth order:" value="" />
               </View>
            </View>
          </View>

           {/* Mother Section */}
           <View style={[styles.row, { borderTop: '1 solid black' }]}>
            <View style={styles.sectionLabel}>
               <Text style={{ fontWeight: 'bold' }}>Mother</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
               {/* Mother Row 1 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <Cell flex={1} label="Maiden name (First):" value={motherName.first} />
                 <Cell flex={1} label="Middle name:" value={motherName.middle} />
                 <Cell flex={1} label="Last name:" value={motherName.last} />
                 <Cell width="20%" style={{ borderRight: 0 }} label="Birthdate:" value={motherData?.dateOfBirth ? getDisplayDate(motherData?.dateOfBirth) : ''} />
               </View>
               
               {/* Mother Row 2 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <Cell width="20%" label="FSM birth state or country:" value={motherData?.additionalData?.nationality?.name} />
                 <Cell width="20%" label="Village:" value={motherData?.village?.name} />
                 <Cell width="20%" label="Municipality:" value="" />
                 <Cell width="20%" label="State (legal residence):" value="" />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Medical record number:" value={motherData?.displayId} />
               </View>

               {/* Mother Row 3 */}
               <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell width="20%" label="Race:" value={getEthnicity(motherData)} />
                 <Cell width="20%" label="Highest grade:" value="" />
                 <Cell width="30%" label="Occupation:" value={motherData?.occupation?.name} />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Marital status:" value={getLabelFromValue(MARITAL_STATUS_OPTIONS, motherData?.additionalData?.maritalStatus)} />
               </View>
            </View>
          </View>

          {/* Father Section */}
          <View style={[styles.row, { borderTop: '1 solid black' }]}>
            <View style={styles.sectionLabel}>
               <Text style={{ fontWeight: 'bold' }}>Father</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
               {/* Father Row 1 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <Cell flex={1} label="First name:" value={fatherName.first} />
                 <Cell flex={1} label="Middle name:" value={fatherName.middle} />
                 <Cell flex={1} label="Last name:" value={fatherName.last} />
                 <Cell width="20%" style={{ borderRight: 0 }} label="Birthdate:" value={fatherData?.dateOfBirth ? getDisplayDate(fatherData?.dateOfBirth) : ''} />
               </View>
               
               {/* Father Row 2 */}
               <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell width="20%" label="Race:" value={getEthnicity(fatherData)} />
                 <Cell width="20%" label="Highest grade:" value="" />
                 <Cell width="30%" label="Occupation:" value={fatherData?.occupation?.name} />
                 <Cell flex={1} style={{ borderRight: 0 }} label="FSM birth state or country:" value={fatherData?.additionalData?.nationality?.name} />
               </View>
            </View>
          </View>

          {/* Certifier Section */}
          <View style={[styles.row, { borderTop: '1 solid black' }]}>
            <View style={styles.sectionLabel}>
               <Text style={{ fontWeight: 'bold' }}>Certifier</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'column' }}>
               {/* Cert Row 1 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0, backgroundColor: '#eee' }]}>
                 <Text style={{ padding: 4, fontSize: 8 }}>
                   I certify that the above named child was born alive at the place and the date specified above
                 </Text>
                 <View style={{ flex: 1 }} />
                 <Cell width="20%" style={{ borderRight: 0, borderLeft: '1 solid black' }} label="Informant:" value="" />
               </View>
               
               {/* Cert Row 2 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <Cell width="30%" label="Certifier name:" value={childData?.birthData?.nameOfAttendantAtBirth} />
                 <Cell width="40%" label="Signature:" value="" />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Date signed:" value="" />
               </View>

               {/* Cert Row 3 */}
               <View style={[styles.row, { borderBottom: '1 solid black', borderLeft: 0 }]}>
                 <View style={{ width: '30%', borderRight: '1 solid black', padding: 2 }}>
                    <Text style={styles.label}>I certify that I reviewed this certificate for completeness and accuracy</Text>
                 </View>
                 <Cell width="30%" label="Name of Director of Health Services or Designee:" value="" />
                 <Cell width="10%" label="Signature:" value="" />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Date signed:" value="" />
               </View>

                {/* Cert Row 4 */}
                <View style={[styles.row, { borderBottom: 0, borderLeft: 0 }]}>
                 <Cell width="40%" label="Certifier name (Chief Clerk of Court):" value="" />
                 <Cell width="20%" label="Signature of Chief Clerk of Court:" value="" />
                 <Cell flex={1} style={{ borderRight: 0 }} label="Date received by Clerk of Courts:" value="" />
               </View>
            </View>
          </View>
        </View>

         {/* Footer / Print date */}
         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={{ fontSize: 7, color: '#666' }}>Print date: {getCurrentDateString()} | Printed by: Initial Admin</Text>
            <Text style={{ fontSize: 7, color: '#666' }}>1 of 1</Text>
         </View>

      </Page>
    </Document>
  );
};
