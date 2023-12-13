import { groupEntriesByLetter } from '/helpers/list';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { RefObject, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { IPatient } from '~/types';
import { PatientTile } from '../PatientTile';

interface PatientSectionListProps {
  onPressItem: (patient: IPatient) => void;
  patients: IPatient[];
}

const SECTION_HEADER_HEIGHT = 30;
const SectionHeader = ({ header }: { header: string }) => {
  return (
    <StyledView
      height={SECTION_HEADER_HEIGHT}
      justifyContent="center"
      background={theme.colors.BOX_OUTLINE}
      paddingLeft={screenPercentageToDP('4.86', Orientation.Width)}
    >
      <StyledText fontSize={screenPercentageToDP('1.45', Orientation.Height)}>{header}</StyledText>
    </StyledView>
  );
};

const ITEM_HEIGHT = 85;
const Item = ({
  item,
  onPressItem,
}: {
  item: IPatient;
  onPressItem: (patient: IPatient) => void;
}) => {
  return (
    <TouchableOpacity
      style={{
        height: ITEM_HEIGHT,
        alignContent: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.BACKGROUND_GREY,
      }}
      onPress={() => onPressItem(item)}
    >
      <PatientTile {...item} />
      <ItemSeparator />
    </TouchableOpacity>
  );
};

const ItemSeparator = () => {
  return (
    <StyledView
      height={StyleSheet.hairlineWidth}
      background={theme.colors.DEFAULT_OFF}
      width="90%"
    />
  );
};

export const PatientSectionList = ({ patients, onPressItem }: PatientSectionListProps) => {
  const scrollViewRef: RefObject<ScrollView> = useRef(null);
  const groupedPatients = useMemo(() => groupEntriesByLetter(patients), [patients]);

  return (
    <StyledView flex={1} width="100%">
      <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
        {groupedPatients.map(group => {
          return (
            <React.Fragment key={group.header}>
              <SectionHeader header={group.header} />
              {group.items.map(item => {
                return <Item key={item.id} onPressItem={onPressItem} item={item} />;
              })}
            </React.Fragment>
          );
        })}
      </ScrollView>
      <StyledView
        width={25}
        position="absolute"
        zIndex={5}
        right={0}
        top="5%"
        background={theme.colors.WHITE}
      >
        {groupedPatients.map((section, sectionIndex) => (
          <TouchableWithoutFeedback
            onPress={() => {
              if (scrollViewRef.current) {
                let offset = 0;
                for (var i = 0; i < sectionIndex; i++) {
                  offset = offset + SECTION_HEADER_HEIGHT;
                  offset = offset + groupedPatients[i].items.length * ITEM_HEIGHT;
                }
                scrollViewRef.current.scrollTo({
                  y: offset,
                });
              }
            }}
            key={section.header}
          >
            <StyledView
              height={screenPercentageToDP('3.03', Orientation.Height)}
              justifyContent="center"
              alignItems="center"
            >
              <StyledText fontSize={screenPercentageToDP('1.33', Orientation.Height)}>
                {section.header}
              </StyledText>
            </StyledView>
          </TouchableWithoutFeedback>
        ))}
      </StyledView>
    </StyledView>
  );
};
