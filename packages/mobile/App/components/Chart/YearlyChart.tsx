
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { BarChart, YAxis, XAxis } from 'react-native-svg-charts';
import { DateFormats } from '/helpers/constants';
import { StyledView, RowView } from '/styled/common';
import { formatDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { BarChartData } from '/interfaces/BarChartProps';
import { Orientation, screenPercentageToDP } from '/helpers/screen';


const styles = StyleSheet.create({
  barChartStyles: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.TEXT_DARK,
  },
  yAxis: { marginBottom: 30, marginRight: 10 },
  xAxisContent: {
    left: screenPercentageToDP(1.6, Orientation.Height),
    right: screenPercentageToDP(2.0, Orientation.Height),
  },
  xAxis: { height: 30 },
});

const svgBarStyle = {
  fill: theme.colors.BRIGHT_BLUE,
};

interface BarChartProps {
  data: BarChartData[];
}
const axesSvg = {
  fontSize: screenPercentageToDP(1.35, Orientation.Height),
  fill: theme.colors.TEXT_DARK,
};
const verticalContentInset = { top: 10, bottom: 10, right: 0 };


export const YearlyChart = memo(
  ({ data }: BarChartProps): JSX.Element => (
    <RowView
      height={screenPercentageToDP('29.79%', Orientation.Height)}
      marginLeft={20}
      overflow="visible"
    >
      <StyledView
        flex={1}
        marginRight={10}
      >
        <StyledView
          flex={1}
          borderRightWidth={StyleSheet.hairlineWidth}
          borderLeftWidth={StyleSheet.hairlineWidth}
        >
          <BarChart
            yAccessor={(
              { item }: { item: BarChartData },
            ): number => item.value}
            style={styles.barChartStyles}
            data={data}
            contentInset={verticalContentInset}
            svg={svgBarStyle}
          />
        </StyledView>
        <XAxis
          style={styles.xAxis}
          formatLabel={(_, index: number): string => formatDate(
            data[index].date,
            DateFormats.SHORT_MONTH,
          )
            }
          data={data}
          contentInset={styles.xAxisContent}
          svg={axesSvg}
        />
      </StyledView>
      <YAxis
        yAccessor={(
          { item }: { item: BarChartData },
        ): number => item.value}
        data={data}
        style={styles.yAxis}
        contentInset={verticalContentInset}
        svg={axesSvg}
      />
    </RowView>
  ),
);
