import React from 'react';
import { CloudOff, CloudDone } from '@material-ui/icons';
import {
  DateDisplay,
  TranslatedReferenceData,
  TranslatedSex,
  TranslatedText,
} from '../../components';
import { getPatientStatus } from '../../utils/getPatientStatus';
import { ThemedTooltip } from '../../components/Tooltip';

const DateCell = React.memo(({ value }) => (
  <DateDisplay date={value} data-testid="datedisplay-bd7t" />
));
export const SexCell = React.memo(({ value }) => (
  <TranslatedSex sex={value} data-testid="translatedsex-1r4y" />
));
const SyncedCell = React.memo(({ value }) =>
  value === true ? (
    <CloudDone color="primary" data-testid="clouddone-zrop" />
  ) : (
    <CloudOff color="primary" data-testid="cloudoff-anvf" />
  ),
);

export const markedForSync = {
  key: 'markedForSync',
  title: (
    <TranslatedText
      stringId="general.localisedField.markedForSync.label.short"
      fallback="Sync"
      data-testid="translatedtext-60y4"
    />
  ),
  minWidth: 26,
  CellComponent: SyncedCell,
  sortable: false,
};

export const displayId = {
  key: 'displayId',
  title: (
    <TranslatedText
      stringId="general.localisedField.displayId.label.short"
      fallback="NHN"
      data-testid="translatedtext-4fdl"
    />
  ),
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: (
    <TranslatedText
      stringId="general.localisedField.firstName.label"
      fallback="First name"
      data-testid="translatedtext-fdwm"
    />
  ),
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: (
    <TranslatedText
      stringId="general.localisedField.lastName.label"
      fallback="Last name"
      data-testid="translatedtext-7lhd"
    />
  ),
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: (
    <TranslatedText
      stringId="general.localisedField.culturalName.label.short"
      fallback="Cultural/traditional name"
      data-testid="translatedtext-w6c0"
    />
  ),
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: (
    <TranslatedText
      stringId="general.localisedField.sex.label"
      fallback="Sex"
      data-testid="translatedtext-7qnh"
    />
  ),
  minWidth: 80,
  CellComponent: SexCell,
  sortable: false,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: (
    <TranslatedText
      stringId="general.localisedField.dateOfBirth.label.short"
      fallback="DOB"
      data-testid="translatedtext-6q6z"
    />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const dateOfDeath = {
  key: 'dateOfDeath',
  title: (
    <TranslatedText
      stringId="general.localisedField.dateOfDeath.label.short"
      fallback="Death"
      data-testid="translatedtext-liz2"
    />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const village = {
  key: 'villageName',
  title: (
    <TranslatedText
      stringId="general.localisedField.villageId.label"
      fallback="Village"
      data-testid="translatedtext-0zax"
    />
  ),
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.villageName ?? ''}
      value={row.villageId}
      category="village"
      data-testid="translatedreferencedata-goo9"
    />
  ),
};

export const department = {
  key: 'departmentName',
  title: (
    <TranslatedText
      stringId="general.department.label"
      fallback="Department"
      data-testid="translatedtext-7ftc"
    />
  ),
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.departmentName ?? ''}
      value={row.departmentId}
      category="department"
      data-testid="translatedreferencedata-2545"
    />
  ),
};

export const status = {
  key: 'patientStatus',
  title: (
    <TranslatedText
      stringId="general.status.label"
      fallback="Status"
      data-testid="translatedtext-5090"
    />
  ),
  sortable: false,
  minWidth: 100,
  accessor: ({ dateOfDeath: dod, encounterType }) =>
    dod ? <strong>Deceased</strong> : getPatientStatus(encounterType),
};

export const clinician = {
  key: 'clinician',
  title: (
    <TranslatedText
      stringId="general.localisedField.clinician.label.short"
      fallback="Clinician"
      data-testid="translatedtext-vsd2"
    />
  ),
  sortable: false,
};

export const vaccinationStatus = {
  key: 'vaccinationStatus',
  title: (
    <TranslatedText
      stringId="vaccine.status.label"
      fallback="Vaccine status"
      data-testid="translatedtext-9t7v"
    />
  ),
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};

export const diet = {
  key: 'diets',
  title: (
    <TranslatedText
      stringId="general.diet.label"
      fallback="Diet"
      data-testid="translatedtext-ptbk"
    />
  ),
  accessor: ({ diets }) => {
    if (!diets?.length) return null;
    const dietNames = diets.map(diet => diet.name);
    const dietCodes = diets.map(diet => diet.code);
    return (
      <ThemedTooltip title={dietNames.join(', ')} data-testid="themedtooltip-osmt">
        <span>{dietCodes.join(', ')}</span>
      </ThemedTooltip>
    );
  },
};

export const inpatientSex = {
  key: 'sex',
  title: (
    <TranslatedText
      stringId="general.localisedField.sex.label"
      fallback="Sex"
      data-testid="translatedtext-k5m2"
    />
  ),
  accessor: ({ sex }) => {
    if (!sex) return null;
    return sex.charAt(0).toUpperCase();
  },
};
