import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { Separator } from '../Separator';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { CalendarIcon } from '../Icons';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

const GivenOnTimeFields: FC<VaccineDataProps> = ({ administeredVaccine }) => {
  const location =
    typeof administeredVaccine.encounter !== 'string'
      ? typeof administeredVaccine.encounter.location !== 'string'
        ? administeredVaccine.encounter.location.name
        : undefined
      : undefined ?? 'Unknown';
  return (
    <StyledView
      height={screenPercentageToDP(34.41, Orientation.Height)}
      background={theme.colors.WHITE}
      style={{
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
      }}
    >
      <ModalField
        label="Date"
        value={formatStringDate(administeredVaccine.date, DateFormats.DDMMYY)}
        Icon={CalendarIcon}
      />
      <Separator />
      <ModalField label="Batch No." value={administeredVaccine.batch} />
      <Separator />
      <ModalField label="Injection site" value={administeredVaccine.injectionSite || 'Unknown'} />
      <Separator />
      <ModalField label="Administered By" value={administeredVaccine.givenBy} />
      <Separator />
      <ModalField label="Location" value={location} />
    </StyledView>
  );
};

export default GivenOnTimeFields;
