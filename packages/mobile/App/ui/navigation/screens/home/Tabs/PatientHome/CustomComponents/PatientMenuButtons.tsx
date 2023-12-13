import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { MenuOptionButtonProps } from '/types/MenuOptionButtonProps';
import React, { ReactElement } from 'react';
import { FlatList } from 'react-native-gesture-handler';

interface PatientMenuListProps {
  list: MenuOptionButtonProps[];
}

export const PatientMenuButtons = ({ list }: PatientMenuListProps): ReactElement => (
  <StyledView background={theme.colors.WHITE}>
    <FlatList
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      data={list}
      keyExtractor={(item): string =>
        item.title}
      renderItem={({ item }): ReactElement => <MenuOptionButton {...item} />}
      ItemSeparatorComponent={Separator}
    />
  </StyledView>
);
