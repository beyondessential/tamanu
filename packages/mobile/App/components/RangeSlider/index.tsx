import React from 'react';
import { StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Marker } from './Marker';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

interface AgeRangeSliderProps {
  rangeStart: number;
  rangeEnd: number;
  onChangeValue: (values: number[]) => void;
  width: number;
  min: number;
  max: number;
}

const styles = StyleSheet.create({
  trackStyle: {
    height: screenPercentageToDP('0.85', Orientation.Height),
    borderRadius: 30,
  },
  selectedTrackStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  unselectedTrackStyle: {
    backgroundColor: theme.colors.DEFAULT_OFF,
  },
});

const touchDimensionsStyles = {
  height: screenPercentageToDP('4.86', Orientation.Height),
  width: screenPercentageToDP('4.86', Orientation.Height),
  borderRadius: 30,
  slipDisplacement: 40,
};

export const AgeRangeSlider = ({
  rangeStart,
  rangeEnd,
  onChangeValue,
  width,
  min,
  max,
}: AgeRangeSliderProps): JSX.Element => (
  <MultiSlider
    values={[rangeStart, rangeEnd]}
    sliderLength={width}
    onValuesChange={onChangeValue}
    min={min}
    max={max}
    step={1}
    trackStyle={styles.trackStyle}
    selectedStyle={styles.selectedTrackStyle}
    unselectedStyle={styles.unselectedTrackStyle}
    touchDimensions={touchDimensionsStyles}
    customMarker={Marker}
    allowOverlap
    snapped
  />
);
