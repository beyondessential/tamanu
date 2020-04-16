import React, { FC } from 'react';
import { View, Text } from 'react-native';
import { ModalField } from './ModalField';
import { VaccineModel } from '../../models/Vaccine';
import { VaccineDataProps } from '.';
import { formatDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';
import { Calendar } from '../Icons';
import { Separator } from '../../navigation/screens/home/PatientDetails/CustomComponents';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';

export const NotTakenFields: FC<VaccineDataProps> = (
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
      value={formatDate(props.date, DateFormats.DAY_MONTH_YEAR_SHORT)}
      Icon={Calendar}
    />
    <Separator />
    <ModalField label="Type" value={props.reason} />
    <Separator />
    <ModalField label="Practitioner" value={props.administered} />
  </StyledView>
);
