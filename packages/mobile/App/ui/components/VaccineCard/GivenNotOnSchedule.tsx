import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { VaccineDataProps } from '.';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { CalendarIcon } from '../Icons';
import { StyledView } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';

export const GivenNotOnScheduleFields: FC<VaccineDataProps> = (
  props: VaccineDataProps,
) => (
  <StyledView
    height={screenPercentageToDP(41.09, Orientation.Height)}
    background={theme.colors.WHITE}
    style={{
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
    }}
  >
    <ModalField
      label="Date"
      value={formatDate(props.date, DateFormats.DAY_MONTH_YEAR_SHORT)}
      Icon={CalendarIcon}
    />
    <ModalField label="Reason" value={props.reason} />
    <ModalField label="Type" value={props.type} />
    <ModalField label="Batch No." value={props.type} />
    <ModalField label="Manufacture" value={props.manufacture} />
    <ModalField label="Administered By" value={props.administered} />
  </StyledView>
);
