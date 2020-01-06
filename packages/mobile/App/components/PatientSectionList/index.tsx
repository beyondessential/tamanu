import React, { useRef, RefObject, useCallback } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { LargeList } from 'react-native-largelist-v3';
import { PatientTile, PatientTileProps } from '../PatientTile';
import { StyledView, StyledText } from '../../styled/common';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

export type PatientSectionListItem = {
  items: PatientTileProps[];
  header: string;
};

interface PatientSectionListProps {
  data: PatientSectionListItem[];
}

const ListSeparator = (): JSX.Element => (
  <StyledView
    height={StyleSheet.hairlineWidth}
    background={theme.colors.DEFAULT_OFF}
    width="90%"
  />
);

export const PatientSectionList = ({
  data,
}: PatientSectionListProps): JSX.Element => {
  const ref: RefObject<LargeList> = useRef(null);

  const scrollToSection = useCallback(
    (header: string) => {
      const headerIndex = data.findIndex(
        (entry: PatientSectionListItem) => entry.header === header,
      );
      if (headerIndex !== -1) {
        if (ref.current) {
          ref.current.scrollToIndexPath({
            section: headerIndex,
            row: 0,
          });
        }
      }
    },
    [data],
  );

  const renderHeader = useCallback(
    (section: number) => (
      <StyledView
        height={screenPercentageToDP(3, Orientation.Height)}
        justifyContent="center"
        background={theme.colors.BOX_OUTLINE}
        paddingLeft={screenPercentageToDP('4.86', Orientation.Width)}
      >
        <StyledText fontSize={screenPercentageToDP('1.45', Orientation.Height)}>
          {data[section].header}
        </StyledText>
      </StyledView>
    ),
    [data],
  );

  const renderItem = React.useCallback(
    ({ section, row }) => (
      <StyledView
        height={85}
        alignItems="center"
        justifyContent="center"
        background={theme.colors.BACKGROUND_GREY}
      >
        <PatientTile {...data[section].items[row]} />
        <ListSeparator />
      </StyledView>
    ),
    [data],
  );

  const heightForSection = React.useCallback(
    () => screenPercentageToDP('3', Orientation.Height),
    [],
  );
  const heightForIndexPath = React.useCallback(
    () => screenPercentageToDP('10.32', Orientation.Height),
    [],
  );

  const scrollToLetter = useCallback(
    header => (): void => {
      scrollToSection(header);
    },
    [scrollToSection],
  );

  const renderAlphabetLetter = useCallback(
    (section: PatientSectionListItem) => (
      <TouchableWithoutFeedback
        onPress={scrollToLetter(section.header)}
        key={section.header}
      >
        <StyledView
          height={screenPercentageToDP('3.03', Orientation.Height)}
          justifyContent="center"
          alignItems="center"
        >
          <StyledText
            fontSize={screenPercentageToDP('1.33', Orientation.Height)}
          >
            {section.header}
          </StyledText>
        </StyledView>
      </TouchableWithoutFeedback>
    ),
    [scrollToLetter],
  );

  return (
    <StyledView flex={1} width="100%">
      <LargeList
        bounces
        ref={ref}
        data={data}
        heightForSection={heightForSection}
        renderSection={renderHeader}
        heightForIndexPath={heightForIndexPath}
        renderIndexPath={renderItem}
      />
      <StyledView
        width={25}
        position="absolute"
        zIndex={5}
        right={0}
        top="5%"
        background={theme.colors.WHITE}
      >
        {data.map(renderAlphabetLetter)}
      </StyledView>
    </StyledView>
  );
};
