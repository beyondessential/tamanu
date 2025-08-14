import React from 'react';
import { AccordionSection } from '../../components/AccordionSection';
import { Typography } from '@mui/material';
import { User } from 'lucide-react';

import { usePatientQuery } from '@api/queries/usePatientQuery';
import { LabelValueList } from '../../components/LabelValueList';
import { StyledCircularProgress } from '../../components/StyledCircularProgress';
import { formatDate, formatSex, formatDisplayId, formatName, formatVillage } from '@utils/format';

export const PatientDetailsSection = () => {
  const { data: patient, isLoading } = usePatientQuery();

  return (
    <AccordionSection header="Patient Details" icon={<User />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : patient ? (
        <LabelValueList>
          <LabelValueList.ListItem label="First Name" value={formatName(patient.firstName)} />
          <LabelValueList.ListItem label="Last Name" value={formatName(patient.lastName)} />
          <LabelValueList.ListItem label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
          <LabelValueList.ListItem label="Sex" value={formatSex(patient.sex)} />
          <LabelValueList.ListItem label="Village" value={formatVillage(patient.village)} />
          <LabelValueList.ListItem label="Patient ID" value={formatDisplayId(patient.displayId)} />
        </LabelValueList>
      ) : (
        <Typography color="text.secondary">Unable to load patient details.</Typography>
      )}
    </AccordionSection>
  );
};
