import React, { type ReactElement } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Separator } from '/components/Separator';
import { MenuOptionButton } from '/components/MenuOptionButton';
import type { MenuOptionButtonProps } from '/types/MenuOptionButtonProps';

interface PatientMenuListProps {
  list: MenuOptionButtonProps[];
}

export const PatientMenuButtons = ({ list }: PatientMenuListProps): ReactElement => (
  <StyledView background={theme.colors.WHITE}>
    <FlatList
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      data={list}
      keyExtractor={(item): string => item.key}
      renderItem={({ item }): ReactElement => {
        const { key: _key, ...props } = item;
        return <MenuOptionButton {...props} />;
      }}
      ItemSeparatorComponent={Separator}
    />
  </StyledView>
);
