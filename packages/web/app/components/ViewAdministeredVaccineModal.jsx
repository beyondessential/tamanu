import React from 'react';
import styled from 'styled-components';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { INJECTION_SITE_LABELS, VACCINE_STATUS, VACCINE_STATUS_LABELS } from '@tamanu/constants';
import { ModalActionRow } from './ModalActionRow';
import { Modal, TranslatedText, TranslatedReferenceData, TranslatedEnum } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { useApi } from '../api';
import { DateDisplay } from './DateDisplay';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { useTranslation } from '../contexts/Translation.jsx';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${Colors.white};
  ${(props) => (props.$editMode ? 'margin-bottom: 20px;' : '')}
  position: relative;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

const DisplayField = styled.div`
  width: 50%;
  padding-right: 15px;
  padding-bottom: 20px;
  color: ${Colors.darkestText};
  font-weight: 500;

  &:nth-child(2n) {
    ${(props) => (props.$editMode ? `border-left: 1px solid ${Colors.outline};` : '')}
    ${(props) => (props.$editMode ? `padding-left: 15px;` : '')}
  }
`;

const Label = styled.div`
  font-weight: 400;
  color: ${Colors.midText};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 90%;
  border-bottom: 1px solid ${Colors.outline};

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 20px;
  }

  padding-top: 20px;
`;

/* eslint-disable react/jsx-key */
const FieldsViewer = ({ labelValueFieldGroups, editMode }) => (
  <Container $editMode={editMode} data-testid="container-p4ga">
    {labelValueFieldGroups.map(({ key, fields }) => (
      <FieldGroup key={key} data-testid={`fieldgroup-noro-${key}`}>
        {fields.map(({ label, value }) => (
          <DisplayField
            key={label}
            $editMode={editMode}
            data-testid={`displayfield-jkpx-${key}-${label.props['data-testid']}`}
          >
            <Label data-testid={`label-4tcx-${key}-${label}`}>{label}</Label>
            {value}
          </DisplayField>
        ))}
      </FieldGroup>
    ))}
  </Container>
);
/* eslint-enable react/jsx-key */

const ErrorMessage = () => {
  return (
    <Box p={5} data-testid="box-iqen">
      <Alert severity="error" data-testid="alert-exfr">
        <AlertTitle data-testid="alerttitle-dn0r">
          <TranslatedText
            stringId="vaccine.error.cantLoadVaccine.title"
            fallback="Error: Cannot load view modal for this vaccine"
            data-testid="translatedtext-2030"
          />
        </AlertTitle>
        <TranslatedText
          stringId="vaccine.error.cantLoadVaccine.subTitle"
          fallback="Please contact administrator"
          data-testid="translatedtext-fvcn"
        />
      </Alert>
    </Box>
  );
};

export const ViewAdministeredVaccineContent = ({ vaccineRecord, editMode }) => {
  const {
    id: vaccineRecordId,
    status,
    injectionSite,
    scheduledVaccine: { label: vaccineLabel, id: vaccineId, doseLabel },
    encounter: { patientId },
    recorder,
    givenBy,
    location,
    department,
    date,
    batch,
    vaccineName,
    vaccineBrand,
    disease,
    givenElsewhere,
    notGivenReason,
    encounter,
    circumstanceIds,
  } = vaccineRecord;
  const routine = !vaccineName;
  const notGiven = VACCINE_STATUS.NOT_GIVEN === status;

  const api = useApi();
  const { data: { data: vaccineCircumstances } = {} } = useQuery({
    queryKey: ['administeredVaccine', patientId, vaccineRecordId],
    queryFn: () =>
      api.get(`patient/${patientId}/administeredVaccine/${vaccineRecordId}/circumstances`),
    // to avoid unnecessary API calls, these are the conditions that will show circumstance
    enabled: Boolean(!editMode && givenElsewhere && circumstanceIds),
  });

  const { getTranslation } = useTranslation();

  if (!vaccineRecord) return null;

  const fieldObjects = {
    vaccine: {
      label: (
        <TranslatedText
          stringId="vaccine.vaccine.label"
          fallback="Vaccine"
          data-testid="translatedtext-igtk"
        />
      ),
      value: vaccineId ? (
        <TranslatedReferenceData
          category="scheduledVaccine"
          fallback={vaccineLabel}
          value={vaccineId}
          data-testid="translatedreferencedata-gmia"
        />
      ) : (
        '-'
      ),
    },
    batch: {
      label: (
        <TranslatedText
          stringId="vaccine.batch.label"
          fallback="Batch"
          data-testid="translatedtext-j02w"
        />
      ),
      value: batch || '-',
    },
    schedule: {
      label: (
        <TranslatedText
          stringId="vaccine.schedule.label"
          fallback="Schedule"
          data-testid="translatedtext-s88j"
        />
      ),
      value: doseLabel || '-',
    },
    dateRecorded: {
      label: (
        <TranslatedText
          stringId="vaccine.dateRecorded.label"
          fallback="Date recorded"
          data-testid="translatedtext-r2gm"
        />
      ),
      value: <DateDisplay date={date} data-testid="datedisplay-dd06" />,
    },
    dateGiven: {
      label: (
        <TranslatedText
          stringId="vaccine.dateGiven.label"
          fallback="Date given"
          data-testid="translatedtext-t6f2"
        />
      ),
      value: <DateDisplay date={date} data-testid="datedisplay-vjag" />,
    },
    injectionSite: {
      label: (
        <TranslatedText
          stringId="vaccine.injectionSite.label"
          fallback="Injection site"
          data-testid="injectsite-m8uo"
        />
      ),
      value: (
        <TranslatedEnum value={injectionSite} enumValues={INJECTION_SITE_LABELS} enumFallback="-" />
      ),
    },
    area: {
      label: (
        <TranslatedText
          stringId="general.area.label"
          fallback="Area"
          data-testid="translatedtext-zk1l"
        />
      ),
      value: location?.locationGroup ? (
        <TranslatedReferenceData
          fallback={location.locationGroup.name}
          value={location.locationGroup.id}
          category="locationGroup"
          data-testid="translatedreferencedata-pnpu"
        />
      ) : (
        '-'
      ),
    },
    location: {
      label: (
        <TranslatedText
          stringId="general.location.label"
          fallback="Location"
          data-testid="translatedtext-7h0p"
        />
      ),
      value: location ? (
        <TranslatedReferenceData
          fallback={location.name}
          value={location.id}
          category="location"
          data-testid="translatedreferencedata-frx7"
        />
      ) : (
        '-'
      ),
    },
    department: {
      label: (
        <TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-testid="translatedtext-n704"
        />
      ),
      value: department ? (
        <TranslatedReferenceData
          fallback={department.name}
          value={department.id}
          category="department"
          data-testid="translatedreferencedata-pcde"
        />
      ) : (
        '-'
      ),
    },
    facility: {
      label: (
        <TranslatedText
          stringId="general.facility.label"
          fallback="Facility"
          data-testid="translatedtext-iukb"
        />
      ),
      value:
        (location?.facility.name && (
          <TranslatedReferenceData
            fallback={location.facility.name}
            value={location.facility.id}
            category="facility"
            data-testid="translatedreferencedata-iqt9"
          />
        )) ||
        (encounter.location.facility.name && (
          <TranslatedReferenceData
            fallback={encounter.location.facility.name}
            value={encounter.location.facility.id}
            category="facility"
            data-testid="translatedreferencedata-lrzp"
          />
        )) ||
        '-',
    },
    givenBy: {
      label: (
        <TranslatedText
          stringId="vaccine.givenBy.label"
          fallback="Given by"
          data-testid="translatedtext-21u3"
        />
      ),
      value: givenBy || '-',
    },
    supervisingClinician: {
      label: (
        <TranslatedText
          stringId="general.supervisingClinician.label"
          fallback="Supervising :clinician"
          replacements={{
            clinician: (
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                casing="lower"
                data-testid="translatedtext-jv8r"
              />
            ),
          }}
          data-testid="translatedtext-qoi6"
        />
      ),
      value: givenBy || '-',
    },
    recordedBy: {
      label: (
        <TranslatedText
          stringId="vaccine.recordedBy.label"
          fallback="Recorded by"
          data-testid="translatedtext-e9ru"
        />
      ),
      value: recorder?.displayName || '-',
    },
    vaccineName: {
      label: (
        <TranslatedText
          stringId="vaccine.vaccineName.label"
          fallback="Vaccine name"
          data-testid="translatedtext-jbi4"
        />
      ),
      value: vaccineName || '-',
    },
    vaccineBrand: {
      label: (
        <TranslatedText
          stringId="vaccine.vaccineBrand.label"
          fallback="Vaccine brand"
          data-testid="translatedtext-q3yc"
        />
      ),
      value: vaccineBrand || '-',
    },
    disease: {
      label: (
        <TranslatedText
          stringId="vaccine.disease.label"
          fallback="Disease"
          data-testid="translatedtext-h50a"
        />
      ),
      value: disease || '-',
    },
    status: {
      label: (
        <TranslatedText
          stringId="vaccine.status.label"
          fallback="Vaccine status"
          data-testid="translatedtext-qgo7"
        />
      ),
      value: givenElsewhere ? (
        'Given elsewhere'
      ) : (
        <TranslatedEnum
          value={status}
          enumValues={VACCINE_STATUS_LABELS}
          enumFallback="-"
          data-testid="translatedenum-sy21"
        />
      ),
    },
    country: {
      label: (
        <TranslatedText
          stringId="vaccine.country.label"
          fallback="Country"
          data-testid="translatedtext-c7hy"
        />
      ),
      value: givenBy || '-',
    },
    reason: {
      label: (
        <TranslatedText
          stringId="general.localisedField.notGivenReasonId.label.short"
          fallback="Reason"
          data-testid="translatedtext-ewjz"
        />
      ),
      value: notGivenReason ? (
        <TranslatedReferenceData
          fallback={notGivenReason.name}
          value={notGivenReason.id}
          category="vaccineNotGivenReason"
          data-testid="translatedreferencedata-9smi"
        />
      ) : (
        '-'
      ),
    },
    circumstance: {
      label: (
        <TranslatedText
          stringId="vaccine.circumstance.label"
          fallback="Circumstance"
          data-testid="translatedtext-rth0"
        />
      ),
      value:
        vaccineCircumstances?.length > 0
          ? vaccineCircumstances
              ?.map(
                circumstance =>
                  circumstance &&
                  getTranslation(
                    getReferenceDataStringId(circumstance.id, 'vaccineCircumstance'),
                    circumstance.name,
                  ),
              )
              ?.join(', ')
          : '-',
    },
  };

  const modalVersions = [
    {
      name: 'routine',
      condition: routine && !notGiven && !givenElsewhere,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.schedule },
            { field: fieldObjects.status },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.givenBy, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'routineOverseas',
      condition: routine && !notGiven && givenElsewhere,
      fieldGroups: [
        {
          key: 'status',
          fields: [
            { field: fieldObjects.circumstance, editMode: false },
            { field: fieldObjects.status, editMode: false },
          ],
        },
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },

            { field: fieldObjects.schedule, editMode: true },
            { field: fieldObjects.status, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },

            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        { key: 'country', fields: [{ field: fieldObjects.country, editMode: false }] },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.facility, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'other',
      condition: !routine && !notGiven && !givenElsewhere,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.vaccineBrand, editMode: false },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.givenBy, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'otherOverseas',
      condition: !routine && !notGiven && givenElsewhere,
      fieldGroups: [
        {
          key: 'status',
          fields: [
            { field: fieldObjects.circumstance, editMode: false },
            { field: fieldObjects.status, editMode: false },
          ],
        },
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.status, editMode: true },
            { field: fieldObjects.facility, editMode: true },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.batch, editMode: false },
            { field: fieldObjects.vaccineBrand, editMode: false },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.dateGiven, editMode: false },
            { field: fieldObjects.injectionSite, editMode: false },
          ],
        },
        { key: 'country', fields: [{ field: fieldObjects.country, editMode: false }] },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.facility, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'notGiven',
      condition: notGiven && routine,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccine },
            { field: fieldObjects.schedule },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.reason, editMode: false },
            { field: fieldObjects.dateRecorded, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.supervisingClinician, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
    {
      name: 'notGivenOther',
      condition: notGiven && !routine,
      fieldGroups: [
        {
          key: 'vaccine',
          fields: [
            { field: fieldObjects.vaccineName },
            { field: fieldObjects.recordedBy, editMode: true },
            { field: fieldObjects.disease, editMode: false },
            { field: fieldObjects.reason, editMode: false },
            { field: fieldObjects.dateRecorded, editMode: false },
            { field: fieldObjects.status },
          ],
        },
        {
          key: 'location',
          fields: [
            { field: fieldObjects.area, editMode: false },
            { field: fieldObjects.location, editMode: false },
            { field: fieldObjects.department, editMode: false },
            { field: fieldObjects.facility, editMode: false },
          ],
        },
        {
          key: 'recorded',
          fields: [
            { field: fieldObjects.supervisingClinician, editMode: false },
            { field: fieldObjects.recordedBy, editMode: false },
          ],
        },
      ],
    },
  ];

  const modalVersion = modalVersions.find(modalType => modalType.condition === true);
  if (!modalVersion) return <ErrorMessage data-testid="errormessage-1gnb" />;
  const fieldGroups = modalVersion.fieldGroups
    .map(group => ({
      ...group,
      fields: group.fields
        .filter(field => {
          // filter out fields if they're conditional on the editMode, and the editMode doesn't match
          // this can be written more concisely but i want it explicit
          if (editMode && field.editMode === true) return true;
          if (!editMode && field.editMode === false) return true;
          if (!Object.prototype.hasOwnProperty.call(field, 'editMode')) return true;
          return false;
        })
        .map(({ field }) => field),
    }))
    .filter(group => {
      // eliminate empty groups
      return group.fields.length > 0;
    });

  return (
    <FieldsViewer
      labelValueFieldGroups={fieldGroups}
      editMode={editMode}
      data-testid="fieldsviewer-mjut"
    />
  );
};

export const ViewAdministeredVaccineModal = ({ open, onClose, vaccineRecord }) => {
  if (!vaccineRecord) return null;
  return (
    <Modal
      title={
        <TranslatedText
          stringId="vaccine.modal.view.title"
          fallback="View vaccine record"
          data-testid="translatedtext-6dl4"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-0n8n"
    >
      <ViewAdministeredVaccineContent
        vaccineRecord={vaccineRecord}
        data-testid="viewadministeredvaccinecontent-6l21"
      />
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-q8qs"
          />
        }
        onConfirm={onClose}
        data-testid="modalactionrow-4hi0"
      />
    </Modal>
  );
};
