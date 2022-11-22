import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useLocalisation } from '/contexts/LocalisationContext';

const vitalRowFieldsToNames = {
  weight: 'Weight (kg)',
  height: 'Height (cm)',
  sbp: 'sbp',
  dbp: 'dbp',
  heartRate: 'Heart Rate',
  respiratoryRate: 'Respiratory Rate',
  temperature: ({ unitSettings }) => {
    if (unitSettings === 'fahrenheit') {
      return 'Temperature (ºF)';
    }
    return 'Temperature (ºC)';
  },
  spo2: 'SpO2 (%)',
  avpu: 'AVPU',
};

export const VitalsTableRowHeader = ({ title }: { title: string }): JSX.Element => {
  const { getString } = useLocalisation();
  const unitSettings = getString('units.temperature', 'celsius');
  const fieldName = vitalRowFieldsToNames[title];

  return (
    <StyledView
      width="100%"
      borderRightWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      background={theme.colors.BACKGROUND_GREY}
      borderBottomWidth={1}
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      height={screenPercentageToDP(5.46, Orientation.Height)}
      justifyContent="center"
    >
      <StyledText
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        color={theme.colors.TEXT_SUPER_DARK}
      >
        {typeof fieldName === 'function' ? fieldName({ unitSettings }) : fieldName}
      </StyledText>
    </StyledView>
  );
};
