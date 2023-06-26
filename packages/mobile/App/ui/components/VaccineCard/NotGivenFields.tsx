import React, { FC } from 'react';
import { RowField } from './RowField';
import { VaccineDataProps } from '.';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

export const NotGivenFields: FC<VaccineDataProps> = ({ administeredVaccine }) => (
  <StyledView
    height={screenPercentageToDP(20.04, Orientation.Height)}
    background={theme.colors.WHITE}
  >
    <RowField
      label="Date recorded"
      value={
        administeredVaccine.date
          ? formatStringDate(administeredVaccine.date, DateFormats.DDMMYY)
          : null
      }
    />
    <RowField label="Schedule" value={administeredVaccine.scheduledVaccine?.schedule} />
    <RowField label="Reason" value={administeredVaccine.notGivenReason?.name} />
    <RowField label="Area" value={administeredVaccine.location?.locationGroup?.name} />
    <RowField label="Location" value={administeredVaccine.location?.name} />
    <RowField label="Department" value={administeredVaccine.department?.name} />
    <RowField label="Supervising clinician" value={administeredVaccine.givenBy} />
    <RowField label="Recorded by" value={administeredVaccine.encounter.examiner.displayName} />
  </StyledView>
);
