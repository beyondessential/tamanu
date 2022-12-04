import React, { PropsWithChildren } from 'react';
import convert from 'convert';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useLocalisation } from '/contexts/LocalisationContext';

const vitalRowFieldsAccessors = {
  temperature: ({ value, unitSettings }) => {
    if (typeof value !== 'number') return '-';

    if (unitSettings === 'fahrenheit') {
      return `${convert(value, 'celsius')
        .to('fahrenheit')
        .toFixed(1)}`;
    }

    return `${value.toFixed(1)}`;
  },
};

export const VitalsTableCell = ({ data, rowKey }: PropsWithChildren<any>): JSX.Element => {
  const { getString } = useLocalisation();
  const unitSettings = getString('units.temperature', 'celsius');

  // console.log('unitSettings', unitSettings);

  const cellValue =
    typeof vitalRowFieldsAccessors[rowKey] === 'function'
      ? vitalRowFieldsAccessors[rowKey]({ value: data.value, unitSettings })
      : data.value;
  return (
    <StyledView
      paddingLeft={screenPercentageToDP(3.64, Orientation.Height)}
      width="100%"
      height={screenPercentageToDP(5.46, Orientation.Height)}
      justifyContent="center"
      borderBottomWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      borderRightWidth={1}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
      >
        {cellValue}
      </StyledText>
    </StyledView>
  );
};
