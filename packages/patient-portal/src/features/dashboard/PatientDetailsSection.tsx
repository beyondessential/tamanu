import React from 'react';
import { AccordionSection } from '../../components/AccordionSection';
import { User } from 'lucide-react';
import { useCurrentUser } from '@routes/PrivateRoute';
import { LabelValueList } from '../../components/LabelValueList';
import { formatSex, formatDisplayId, formatName, formatVillage } from '@utils/format';
import { useDateTimeFormat } from '@tamanu/ui-components';

export const PatientDetailsSection = () => {
  const { formatShort } = useDateTimeFormat();
  const patient = useCurrentUser();

  return (
    <AccordionSection header="Patient details" icon={<User />}>
      <LabelValueList>
        <LabelValueList.ListItem label="First Name" value={formatName(patient.firstName)} />
        <LabelValueList.ListItem label="Last Name" value={formatName(patient.lastName)} />
        <LabelValueList.ListItem label="Date of Birth" value={formatShort(patient.dateOfBirth)} />
        <LabelValueList.ListItem label="Sex" value={formatSex(patient.sex)} />
        <LabelValueList.ListItem label="Village" value={formatVillage(patient.village)} />
        <LabelValueList.ListItem label="Patient ID" value={formatDisplayId(patient.displayId)} />
      </LabelValueList>
    </AccordionSection>
  );
};
