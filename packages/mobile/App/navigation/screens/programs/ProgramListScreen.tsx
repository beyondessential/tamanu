import React, { useState, useCallback, useEffect, ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { api } from '/services/API';
import { ProgramModel } from '/models/Program';
import { theme } from '/styled/theme';
import {
  MenuOptionButton,
  MenuOptionButtonProps,
} from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';

export const ProgramListScreen = (): ReactElement => {
  const navigation = useNavigation();
  const [data, setdata] = useState<MenuOptionButtonProps[]>([]);
  const [programs, setprograms] = useState<ProgramModel[]>([]);
  const getPrograms = useCallback(async () => {
    try {
      const response = await api.programs.get();
      setprograms(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    getPrograms();
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  useEffect(() => {
    if (programs.length > 0) {
      setdata(
        programs.map(program => ({
          title: program.name,
          onPress: (): void =>
            navigation.navigate(
              Routes.HomeStack.ProgramStack.ProgramTabs.name,
              {
                program,
              },
            ),
          fontWeight: 500,
          textColor: theme.colors.TEXT_SUPER_DARK,
        })),
      );
    }
  }, [programs]);

  return (
    <FullView>
      <StackHeader title="Programs" subtitle="Ugyen Wangdi" onGoBack={goBack} />
      <FlatList
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: theme.colors.BACKGROUND_GREY,
        }}
        showsVerticalScrollIndicator={false}
        data={data}
        keyExtractor={(item): string => item.title}
        renderItem={({ item }): ReactElement => <MenuOptionButton {...item} />}
        ItemSeparatorComponent={Separator}
      />
    </FullView>
  );
};
