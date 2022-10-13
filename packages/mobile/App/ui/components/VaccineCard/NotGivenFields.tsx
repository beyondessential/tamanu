import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { VaccineDataProps } from '.';
import { CalendarIcon } from '../Icons';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { Separator } from '../Separator';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

export const NotGivenFields: FC<VaccineDataProps> = ({ administeredVaccine }) => (
  <StyledView
    height={screenPercentageToDP(20.04, Orientation.Height)}
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
    <ModalField label="Reason" value={administeredVaccine.reason} />
    <Separator />
    <ModalField label="Practitioner" value={administeredVaccine.encounter.examiner.displayName || 'Unknown'} />
  </StyledView>
);
