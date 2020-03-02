import React, { ReactElement, FC } from 'react';
import { FlatList } from 'react-native';
// Components
import { Button } from '../../../../../components/Button';
import {
  Search,
  DotsMenu,
  LeftArrow,
} from '../../../../../components/Icons';
import { StyledText, StyledView, RowView } from '../../../../../styled/common';
import { MenuOptionButton } from '../../../../../components/MenuOptionButton';
import { PatientMenuButton } from '../../../../../components/PatientMenuButton';
// Helpers
import { MaleGender } from '../../../../../helpers/constants';
import { theme } from '../../../../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../../../../helpers/screen';

interface ButtonProps {
    onPress: () => void
}

export const BackButton: FC<ButtonProps> = ({ onPress }: ButtonProps): ReactElement => (
  <Button
    onPress={onPress}
    backgroundColor="transparent"
    flex={1}
  >
    <LeftArrow />
  </Button>
);
export const SearchButton: FC<ButtonProps> = ({ onPress }: ButtonProps): ReactElement => (
  <Button
    height={screenPercentageToDP(4.25, Orientation.Height)}
    width={screenPercentageToDP(65.59, Orientation.Width)}
    borderRadius={40}
    backgroundColor="#215383"
    onPress={onPress}
  >
    <Search fill="#67A6E3" />
    <StyledText
      marginLeft={10}
      color="#67A6E3"
    >
      Search for patients
    </StyledText>
  </Button>
);

export const DotsMenuButton: FC<ButtonProps> = ({ onPress }: ButtonProps): ReactElement => (
  <Button
    onPress={onPress}
    flex={1}
    backgroundColor="transparent"
  >
    <DotsMenu />
  </Button>
);

export const Separator = (): ReactElement => (
  <StyledView
    alignSelf="center"
    height={1}
    background={theme.colors.DEFAULT_OFF}
    width="90.24%"
  />
);

export const mockAvatar = {
  size: 60,
  age: 34,
  name: 'Tony Robbins',
  gender: MaleGender.value,
  city: 'Mbelagha',
};

interface PatientMenuListprops {
    list: any[]
}

export const PatientMenuButtons = ({ list }:PatientMenuListprops): ReactElement => (
  <StyledView background={theme.colors.WHITE}>
    <FlatList
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      data={list}
      keyExtractor={(item): string => item.title}
      renderItem={({ item }): ReactElement => <MenuOptionButton {...item} />}
      ItemSeparatorComponent={Separator}
    />
  </StyledView>
);

interface VisitTypeButtonsProps {
    list: any[]
}

export const VisitTypeButtons = ({ list }:VisitTypeButtonsProps): ReactElement => (
  <StyledView
    width="100%"
    marginTop={20}
  >
    <RowView
      width="100%"
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {
        list.slice(0, list.length / 2).map(buttonProps => (
          <PatientMenuButton
            {...buttonProps}
          />
        ))
      }
    </RowView>
    <RowView
      width="100%"
      marginTop={screenPercentageToDP(2.64, Orientation.Width)}
      paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.64, Orientation.Width)}
      justifyContent="space-between"
    >
      {
        list.slice(list.length / 2, list.length).map(buttonProps => (
          <PatientMenuButton
            {...buttonProps}
          />
        ))
      }
    </RowView>
  </StyledView>
);
