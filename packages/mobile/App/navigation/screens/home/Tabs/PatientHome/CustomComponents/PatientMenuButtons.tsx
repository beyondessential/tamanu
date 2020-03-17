import React, { ReactElement } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { StyledView } from '../../../../../../styled/common';
import { theme } from '../../../../../../styled/theme';
import { Separator } from '../../../../../../components/Separator';
import { MenuOptionButton } from '../../../../../../components/MenuOptionButton';

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
