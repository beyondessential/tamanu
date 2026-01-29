import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  EDUCATIONAL_ATTAINMENT_LABELS,
  BIRTH_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  SEX_OPTIONS,
} from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { getEthnicity } from '../patientAccessors';
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
  lastCell: {
    borderRight: 0,
  },
  label: {
    fontSize: 9,
    marginBottom: 2,
    color: '#333',
  },
  value: {
    fontSize: 9,
  },
  headerRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  governmentBox: {
    fontSize: 10,
    width: 110,
    padding: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sealBox: {
    fontSize: 10,
    width: 110,
    padding: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titleBox: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0000001A',
    borderBottom: '1 solid black',
    padding: 5,
  },
  headerTitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionLabel: {
    width: 50,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#0000001A',
    borderRight: '1 solid black',
    padding: 4,
  },
  sectionContent: {
    flex: 1,
    flexDirection: 'column',
  },
  colouredCell: {
    backgroundColor: '#0000001A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    borderTop: '1 solid #DEDEDE',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
});

const Cell = ({ label, value = '', style, width, flex, lastCell = false }) => (
  <View style={[styles.cell, style, width ? { width } : {}, flex ? { flex } : {}, lastCell ? styles.lastCell : {}]}>
    {label && <Text bold style={styles.label}>{label}</Text>}
    <Text style={styles.value}>{value || ' '}</Text>
  </View>
);

const getLabelFromValue = (mapping, v) => {
  const entry = mapping.find(e => e.value === v);
  return entry ? entry.label : '';
};

const getCountryOfBirth = ({ additionalData }) => {
  return additionalData?.placeOfBirth || additionalData?.countryOfBirth?.name;
};

export const FSMBirthNotificationCertificate = ({
  motherData,
  fatherData,
  childData,
  printedBy,
}) => {
  const currentDateString = getCurrentDateString();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.table}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <View style={[styles.sectionLabel, styles.governmentBox]}>
              <Text bold>GOVERNMENT</Text>
            </View>
            <View style={styles.titleBox}>
              <Text bold style={styles.headerTitle}>CERTIFICATE OF LIVE BIRTH</Text>
              <Text bold style={styles.headerSubtitle}>FEDERATED STATES OF MICRONESIA</Text>
            </View>
          </View>

          {/* Row 2: Court Info */}
          <View style={styles.row}>
            <View style={[styles.sectionLabel, styles.sealBox]}>
              <Text bold>SEAL</Text>
            </View>
            <Cell flex={1} label="State court file no.:" />
            <Cell flex={1} label="Date:" value={currentDateString} />
            <Cell flex={1} lastCell label="Medical record no:" value={childData?.displayId} />
          </View>

          {/* Child Section */}
          <View style={styles.row}>
            <View style={styles.sectionLabel}>
              <Text bold>Child</Text>
            </View>

            <View style={styles.sectionContent}>
              {/* Child Row 1 */}
              <View style={styles.row}>
                <Cell flex={1} label="First name:" value={childData?.firstName} />
                <Cell flex={1} label="Middle name:" value={childData?.middleName} />
                <Cell flex={1} label="Last name:" value={childData?.lastName} />
                <Cell width={183} lastCell label="Plurality:" value={getLabelFromValue(BIRTH_TYPE_OPTIONS, childData?.birthData?.birthType)} />
              </View>

              {/* Child Row 2 */}
              <View style={styles.lastRow}>
                <Cell width={146} label="Date of birth:" value={childData?.dateOfBirth ? getDisplayDate(childData?.dateOfBirth) : ''} />
                <Cell width={110} label="Sex:" value={getLabelFromValue(SEX_OPTIONS, childData?.sex)} />
                <Cell width={146} label="Delivery site:" value={getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, childData?.birthData?.registeredBirthPlace)} />
                <Cell width={146} label="Attendant:" value={getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, childData?.birthData?.nameOfAttendantAtBirth)} />
                <Cell width={183} lastCell label="Birth order:" />
              </View>
            </View>
          </View>

          {/* Mother Section */}
          <View style={styles.row}>
            <View style={styles.sectionLabel}>
              <Text bold>Mother</Text>
            </View>

            <View style={styles.sectionContent}>
              {/* Mother Row 1 */}
              <View style={styles.row}>
                <Cell flex={1} label="Maiden name (First):" value={motherData?.firstName} />
                <Cell flex={1} label="Middle name:" value={motherData?.middleName} />
                <Cell flex={1} label="Last name:" value={motherData?.lastName} />
                <Cell width={183} lastCell label="Birthdate:" value={motherData?.dateOfBirth ? getDisplayDate(motherData?.dateOfBirth) : ''} />
              </View>

              {/* Mother Row 2 */}
              <View style={styles.row}>
                <Cell width={146} label="FSM birth state or country:" value={getCountryOfBirth(motherData)} />
                <Cell width={110} label="Village:" value={motherData?.village?.name} />
                <Cell width={146} label="Municipality:" value={motherData?.additionalData?.cityTown} />
                <Cell width={146} label="State (legal residence):" value={motherData?.additionalData?.country?.name} />
                <Cell width={183} lastCell label="Medical record number:" value={motherData?.displayId} />
              </View>

              {/* Mother Row 3 */}
              <View style={styles.lastRow}>
                <Cell flex={1} label="Race:" value={getEthnicity(motherData)} />
                <Cell flex={1} label="Highest grade:" value={EDUCATIONAL_ATTAINMENT_LABELS[motherData?.additionalData?.educationalLevel]} />
                <Cell flex={1} label="Occupation:" value={motherData?.occupation?.name} />
                <Cell width={183} lastCell label="Marital status:" value={getLabelFromValue(MARITAL_STATUS_OPTIONS, motherData?.additionalData?.maritalStatus)} />
              </View>
            </View>
          </View>

          {/* Father Section */}
          <View style={styles.row}>
            <View style={styles.sectionLabel}>
              <Text bold>Father</Text>
            </View>

            <View style={styles.sectionContent}>
              {/* Father Row 1 */}
              <View style={styles.row}>
                <Cell flex={1} label="First name:" value={fatherData?.firstName} />
                <Cell flex={1} label="Middle name:" value={fatherData?.middleName} />
                <Cell flex={1} label="Last name:" value={fatherData?.lastName} />
                <Cell width={183} lastCell label="Birthdate:" value={fatherData?.dateOfBirth ? getDisplayDate(fatherData?.dateOfBirth) : ''} />
              </View>

              {/* Father Row 2 */}
              <View style={styles.lastRow}>
                <Cell flex={1} label="Race:" value={getEthnicity(fatherData)} />
                <Cell flex={1} label="Highest grade:" value={EDUCATIONAL_ATTAINMENT_LABELS[fatherData?.additionalData?.educationalLevel]} />
                <Cell flex={1} label="Occupation:" value={fatherData?.occupation?.name} />
                <Cell width={183} lastCell label="FSM birth state or country:" value={getCountryOfBirth(fatherData)} />
              </View>
            </View>
          </View>

          {/* Certifier Section */}
          <View style={styles.lastRow}>
            <View style={styles.sectionLabel}>
              <Text bold>Certifier</Text>
            </View>

            <View style={styles.sectionContent}>
              {/* Cert Row 1 */}
              <View style={styles.row}>
                <Cell style={styles.colouredCell} flex={1} label="I certify that the above named child was born alive at the place and the date specified above" />
                <Cell width={183} lastCell label="Informant:" />
              </View>

              {/* Cert Row 2 */}
              <View style={styles.row}>
                <Cell flex={1} label="Certifier name:" />
                <Cell flex={1} label="Signature:" />
                <Cell width={146} label="Date signed:" />
                <Cell width={183} lastCell label="Mother/Father agrees to NAME spelling (signatures)" />
              </View>

              {/* Cert Row 3 */}
              <View style={styles.row}>
                <Cell style={styles.colouredCell} width={176} label="I certify that I reviewed this certificate for completeness and accuracy" />
                <Cell width={212} label="Name of Director of Health Services or Designee:" />
                <Cell width={161} label="Signature:" />
                <Cell width={183} lastCell label="Date signed:" />
              </View>

              {/* Cert Row 4 */}
              <View style={styles.lastRow}>
                <Cell flex={1} label="Certifier name (Chief Clerk of Court):" />
                <Cell flex={1} label="Signature of Chief Clerk of Court:" />
                <Cell width={183} lastCell label="Date received by Clerk of Courts:" />
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.lastRow}>
            <Text bold style={styles.footerText}>Print date: </Text>
            <Text style={styles.footerText}>{currentDateString} | </Text>
            <Text bold style={styles.footerText}>Printed by: </Text>
            <Text style={styles.footerText}>{printedBy}</Text>
          </View>
          <View style={styles.lastRow}>
            <Text style={styles.footerText}>1 of 1</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
