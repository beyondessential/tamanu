import React, { FC } from 'react';
import { RowField } from './RowField';
import { VaccineDataProps } from '.';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { TranslatedReferenceData } from '../Translations/TranslatedReferenceData';
import { TranslatedText } from '../Translations/TranslatedText';
import { ReferenceDataType } from '~/types';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

export const NotGivenFields: FC<VaccineDataProps> = ({ administeredVaccine }) => {
  const { formatShort } = useDateTimeFormat();

  return (
  <StyledView
    height={screenPercentageToDP(20.04, Orientation.Height)}
    background={theme.colors.WHITE}
  >
    <RowField
      label={<TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />}
      value={administeredVaccine.date ? formatShort(administeredVaccine.date) : null}
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.schedule.label" fallback="Schedule" />}
      value={administeredVaccine.scheduledVaccine?.doseLabel}
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.notGivenReason.label" fallback="Reason" />}
      value={
        <TranslatedReferenceData
          fallback={administeredVaccine.notGivenReason?.name}
          value={administeredVaccine.notGivenReason?.id}
          category={ReferenceDataType.VaccineNotGivenReason}
        />
      }
    />
    <RowField
      label={<TranslatedText stringId="general.form.area.label" fallback="Area" />}
      value={
        <TranslatedReferenceData
          fallback={administeredVaccine.location?.locationGroup?.name}
          value={administeredVaccine.location?.locationGroup?.id}
          category="locationGroup"
        />
      }
    />
    <RowField
      label={<TranslatedText stringId="general.form.location.label" fallback="Location" />}
      value={
        <TranslatedReferenceData
          fallback={administeredVaccine.location?.name}
          value={administeredVaccine.location?.id}
          category="location"
        />
      }
    />
    <RowField
      label={<TranslatedText stringId="general.form.department.label" fallback="Department" />}
      value={
        <TranslatedReferenceData
          fallback={administeredVaccine.department?.name}
          value={administeredVaccine.department?.id}
          category="location"
        />
      }
    />
    <RowField
      label={
        <TranslatedText
          stringId="vaccine.form.supervisingClinician.label"
          fallback="Supervising clinician"
        />
      }
      value={administeredVaccine.givenBy}
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.recordedBy.label" fallback="Recorded by" />}
      value={administeredVaccine.encounter.examiner.displayName}
    />
  </StyledView>
  );
};
