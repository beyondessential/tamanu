import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { Separator } from '../Separator';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { CalendarIcon } from '../Icons';

const GivenOnTimeFields: FC<VaccineDataProps> = (props: VaccineDataProps) => (
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
      value={formatDate(props.date, DateFormats.DAY_MONTH_YEAR_SHORT)}
      Icon={CalendarIcon}
    />
    <Separator />
    <ModalField label="Type" value={props.type} />
    <Separator />
    <ModalField label="Batch No." value={props.type} />
    <Separator />
    <ModalField label="Manufacture" value={props.manufacture} />
    <Separator />
    <ModalField label="Administered By" value={props.administered} />
  </StyledView>
);

export default GivenOnTimeFields;
