import React, { type ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemeProvider } from 'styled-components';
import { StyledView, themeSystem } from '/styled/common';
import { theme } from '/styled/theme';
import {
  FeedbackIcon,
  HistoryIcon,
  PatientDetailsIcon,
  QuestionIcon,
  RingIcon,
  SettingsIcon,
} from '../Icons';
import { MenuOptionButton } from './index';
import type { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';

export const MoreMenuOptions = [
  {
    key: 'settings',
    title: 'Settings',
    Icon: SettingsIcon,
    onPress: (): void => console.log('Settings'),
  },
  {
    key: 'feedback',
    title: 'Feedback',
    Icon: FeedbackIcon,
    onPress: (): void => console.log('Feedback'),
  },
  {
    key: 'faqs',
    title: 'FAQs',
    Icon: QuestionIcon,
    onPress: (): void => console.log('Question'),
  },
  {
    key: 'notifications',
    title: 'Notifications',
    Icon: RingIcon,
    onPress: (): void => console.log('Notification'),
  },
];

export const ProgramOptions = [
  {
    key: 'familyPlanning',
    title: 'Family Planning',
    onPress: (): void => console.log('Family Planning'),
  },
  {
    key: 'pregnant',
    title: 'Pregnant',
    onPress: (): void => console.log('Family Planning'),
  },
  {
    key: 'programType3',
    title: 'Program type 3',
    onPress: (): void => console.log('Family Planning'),
  },
  {
    key: 'programType4',
    title: 'Program type 4',
    onPress: (): void => console.log('Family Planning'),
  },
  {
    key: 'programType5',
    title: 'Program type 5',
    onPress: (): void => console.log('Family Planning'),
  },
  {
    key: 'programType6',
    title: 'Program type 6',
    onPress: (): void => console.log('Family Planning'),
  },
];

export const PatientDetails = [
  {
    key: 'viewPatientDetails',
    title: 'View patient details',
    Icon: HistoryIcon,
    onPress: (): void => console.log('Patient details'),
  },
  {
    key: 'viewHistory',
    title: 'View History',
    Icon: PatientDetailsIcon,
    onPress: (): void => console.log('History'),
  },
];

const Separator = (): ReactElement => (
  <StyledView alignSelf="center" height={1} background={theme.colors.DEFAULT_OFF} width="90.24%" />
);

const styles = StyleSheet.create({
  flatList: {
    width: '100%',
  },
});

interface BaseStoryProps {
  data: MenuOptionButtonProps[];
}

export const BaseStory = ({ data }: BaseStoryProps): ReactElement => (
  <ThemeProvider theme={themeSystem}>
    <FlatList
      showsVerticalScrollIndicator={false}
      style={styles.flatList}
      data={data}
      keyExtractor={(item): string => item.key}
      renderItem={({ item }): any => <MenuOptionButton {...item} />}
      ItemSeparatorComponent={Separator}
    />
  </ThemeProvider>
);
