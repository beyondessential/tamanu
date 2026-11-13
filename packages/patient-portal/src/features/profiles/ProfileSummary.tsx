import React from 'react';
import { SEX_LABELS } from '@tamanu/constants';
import { useTranslation } from '@tamanu/ui-components';
import { type PortalProfile } from '@tamanu/shared/schemas/patientPortal';
import { RowDetail, RowText, RowTitle } from '@components/layout';
import { formatRecordDate } from '../record/recordList';

type ProfilePatient = Pick<
  PortalProfile,
  'firstName' | 'lastName' | 'dateOfBirth' | 'sex' | 'displayId'
>;

/** A patient's name, with their date of birth, sex and display ID beneath. */
export const ProfileSummary = ({ patient }: { patient: ProfilePatient }) => {
  const { getEnumTranslation } = useTranslation();
  const sexInitial = getEnumTranslation(SEX_LABELS, patient.sex).charAt(0);

  return (
    <RowText>
      <RowTitle>{`${patient.firstName} ${patient.lastName}`}</RowTitle>
      <RowDetail>
        {[formatRecordDate(patient.dateOfBirth), sexInitial, patient.displayId].join(' • ')}
      </RowDetail>
    </RowText>
  );
};
