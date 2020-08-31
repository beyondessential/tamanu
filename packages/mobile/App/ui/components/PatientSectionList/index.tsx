import React, { useRef, useMemo, RefObject, useCallback } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { LargeList } from 'react-native-largelist-v3';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { PatientTile } from '../PatientTile';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IPatient } from '~/types';
import { getAgeFromDate } from '/helpers/date';
import { joinNames } from '/helpers/user';
import { groupEntriesByLetter } from '/helpers/list';

export type PatientSectionListItem = {
  items: IPatient[];
  header: string;
};

interface PatientSectionListProps {
  onPressItem: (patient: IPatient) => void;
  patients: PatientSectionListItem[];
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
  onPressItem = (): null => null,
}: PatientSectionListProps): JSX.Element => {
  const ref: RefObject<LargeList> = useRef(null);

  const groupedData = useMemo(
    () => groupEntriesByLetter(data),
    [data]
  );

  const scrollToSection = useCallback(
    (header: string) => {
      const headerIndex = groupedData.findIndex(
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
    [groupedData],
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
          {groupedData[section].header}
        </StyledText>
      </StyledView>
    ),
    [groupedData],
  );

  const renderItem = React.useCallback(
    ({ section, row }) => {
      const patient = groupedData[section].items[row];
      const onPress = (): void => onPressItem(patient)
      return (
        <TouchableOpacity onPress={onPress}>
          <StyledView
            height={85}
            alignItems="center"
            justifyContent="center"
            background={theme.colors.BACKGROUND_GREY}
          >
            <PatientTile
              displayId={patient.displayId}
              city={patient.city || 'city'}
              gender={patient.gender}
              lastVisit={patient.lastVisit || new Date()}
              name={joinNames(patient)}
              age={getAgeFromDate(patient.dateOfBirth)}
            />
            <ListSeparator />
          </StyledView>
        </TouchableOpacity>
      );
    },
    [groupedData],
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
        data={groupedData}
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
        {groupedData.map(renderAlphabetLetter)}
      </StyledView>
    </StyledView>
  );
};
