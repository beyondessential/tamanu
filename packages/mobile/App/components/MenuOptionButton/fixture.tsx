import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemeProvider } from 'styled-components';
import {
  History,
  Appointments,
  Settings,
  Feedback,
  Question,
  Ring,
} from '../Icons';
import { MenuOptionButton } from './index';
import {
  StyledView,
  themeSystem,
  StyledSafeAreaView,
} from '../../styled/common';
import { theme } from '../../styled/theme';

export const MoreMenuOptions = [
  {
    title: 'Settings',
    Icon: Settings,
    onPress: () => console.log('Settings'),
  },
  {
    title: 'Feedback',
    Icon: Feedback,
    onPress: () => console.log('Feedback'),
  },
  {
    title: 'FAQs',
    Icon: Question,
    onPress: () => console.log('Question'),
  },
  {
    title: 'Notifications',
    Icon: Ring,
    onPress: () => console.log('Notification'),
  },
];

export const ProgramOptions = [
  {
    title: 'Family Planning',
    onPress: () => console.log('Family Planning'),
  },
  {
    title: 'Pregnant',
    onPress: () => console.log('Family Planning'),
  },
  {
    title: 'Program type 3',
    onPress: () => console.log('Family Planning'),
  },
  {
    title: 'Program type 4',
    onPress: () => console.log('Family Planning'),
  },
  {
    title: 'Program type 5',
    onPress: () => console.log('Family Planning'),
  },
  {
    title: 'Program type 6',
    onPress: () => console.log('Family Planning'),
  },
];

export const PatientDetails = [
  {
    title: 'View patients details',
    Icon: History,
    onPress: () => console.log('Patient details'),
  },
  {
    title: 'View History',
    Icon: Appointments,
    onPress: () => console.log('History'),
  },
];

const Separator = () => (
  <StyledView
    alignSelf="center"
    height={1}
    background={theme.colors.DEFAULT_OFF}
    width="90.24%"
  />
);

const styles = StyleSheet.create({
  flatList: {
    width: '100%',
  },
});

interface BaseStoryProps {
  data: MenuOptionButton[];
}

export const BaseStory = ({ data }: BaseStoryProps) => (
  <ThemeProvider theme={themeSystem}>
    <StyledSafeAreaView />
    <FlatList
      showsVerticalScrollIndicator={false}
      style={styles.flatList}
      data={data}
      keyExtractor={item => item.title}
      renderItem={({ item }) => <MenuOptionButton {...item} />}
      ItemSeparatorComponent={Separator}
    />
  </ThemeProvider>
);
