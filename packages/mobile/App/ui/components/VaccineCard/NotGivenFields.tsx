import React, { FC } from 'react';
import { ModalField } from './ModalField';
import { VaccineDataProps } from '.';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { CalendarIcon } from '../Icons';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { Separator } from '../Separator';

export const NotGivenFields: FC<VaccineDataProps> = (
  props: VaccineDataProps,
) => (
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
      value={props.date}
      Icon={CalendarIcon}
    />
    <Separator />
    <ModalField label="Type" value={props.type} />
    <Separator />
    <ModalField label="Practitioner" value={props.administered} />
  </StyledView>
);
