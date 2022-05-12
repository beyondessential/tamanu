import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { Separator } from '../Separator';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { CalendarIcon } from '../Icons';

const GivenOnTimeFields: FC<VaccineDataProps> = ({ administeredVaccine }) => (
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
      value={administeredVaccine.date.toDateString()}
      Icon={CalendarIcon}
    />
    <Separator />
    <ModalField label="Batch No." value={administeredVaccine.batch} />
    <Separator />
    <ModalField label="Injection site" value={administeredVaccine.injectionSite || 'Unknown'} />
    <Separator />
    <ModalField
      label="Administered By"
      value={
        typeof administeredVaccine.encounter !== 'string'
          ? typeof administeredVaccine.encounter.examiner !== 'string'
            ? administeredVaccine.encounter.examiner.displayName
            : undefined
          : undefined ?? 'Unknown'
      }
    />
    <Separator />
    <ModalField
      label="Location"
      value={
        typeof administeredVaccine.encounter !== 'string'
          ? typeof administeredVaccine.encounter.location !== 'string'
            ? administeredVaccine.encounter.location.name
            : undefined
          : undefined ?? 'Unknown'
      }
    />
  </StyledView>
);

export default GivenOnTimeFields;
