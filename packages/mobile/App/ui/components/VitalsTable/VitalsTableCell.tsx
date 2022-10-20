import React, { PropsWithChildren } from 'react';
import convert from 'convert';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useLocalisation } from '/contexts/LocalisationContext';

const vitalRowFieldsAccessors = {
  temperature: ({ value, unitSetting }) => {
    if (typeof value !== 'number') return '-';

    if (unitSetting.temperature === 'celsius') {
      return `${value.toFixed(2)}`;
    }

    return `${convert(value, 'celsius')
      .to('fahrenheit')
      .toFixed(2)}`;
  },
};

export const VitalsTableCell = ({ data, rowKey }: PropsWithChildren<any>): JSX.Element => {
  const { getString } = useLocalisation();
  const unitSetting = getString('units.temperature', 'celsius');
  const cellValue =
    typeof vitalRowFieldsAccessors[rowKey] === 'function'
      ? vitalRowFieldsAccessors[rowKey]({ value: data.value, unitSetting })
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
