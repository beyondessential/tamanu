import React, { FC } from 'react';
import { RowField } from './RowField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

const GivenOnTimeFields: FC<VaccineDataProps> = ({ administeredVaccine }) => (
  <StyledView
    height={screenPercentageToDP(34.41, Orientation.Height)}
    marginLeft={screenPercentageToDP(2.41, Orientation.Width)}
    marginRight={screenPercentageToDP(2.41, Orientation.Width)}
    background={theme.colors.WHITE}
  >
    <RowField
      label="Date given"
      value={formatStringDate(administeredVaccine.date, DateFormats.DDMMYY)}
    />
    <RowField label="Schedule" value={administeredVaccine.scheduledVaccine?.schedule} />
    <RowField label="Batch No." value={administeredVaccine.batch} />
    <RowField label="Injection site" value={administeredVaccine.injectionSite} />
    <RowField label="Area" value={administeredVaccine.encounter?.location?.locationGroup?.name} />
    <RowField label="Location" value={administeredVaccine.encounter?.location?.name} />
    <RowField label="Department" value={administeredVaccine.encounter?.department?.name} />
    <RowField label="Given by" value={administeredVaccine.givenBy} />
    <RowField label="Recorded by" value={administeredVaccine.encounter?.examiner.displayName} />
  </StyledView>
);

export default GivenOnTimeFields;
