import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '~/ui/helpers/routes';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { SearchInput } from '~/ui/components/SearchInput';
import { FlatList } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { useBackendEffect } from '~/ui/hooks/index';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useAuth } from '~/ui/contexts/AuthContext';

const ProgramRegistryListItem = ({ item }) => {
  const navigation = useNavigation();
  return (
    <StyledTouchableOpacity
      onPress={() => {
        navigation.navigate(
          Routes.HomeStack.PatientProgramRegistryFormStack.PatientProgramRegistryForm,
          { programRegistry: item },
        );
      }}
    >
      <StyledView marginRight={20} marginLeft={20} paddingTop={10} paddingBottom={10}>
        <StyledText fontSize={14} fontWeight={400}>
          {item.name}
        </StyledText>
      </StyledView>
    </StyledTouchableOpacity>
  );
};

export const SelectProgramRegistryForm = ({ navigation, route }: BaseAppProps) => {
  const { selectedPatient } = route.params;
  const [searchValue, setSearchValue] = useState('');
  const { ability } = useAuth();
  const canListRegistrations = ability.can('list', 'PatientProgramRegistration');

  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) => {
      if (canListRegistrations === false) return [];
      return await models.ProgramRegistry.getProgramRegistriesForPatient(selectedPatient.id)
    },
    [canListRegistrations, selectedPatient.id],
  );

  if (isProgramRegistryLoading) return <LoadingScreen />;

  if (programRegistryError) return <ErrorScreen error={programRegistryError} />;

  return (
    <FullView background={theme.colors.WHITE}>
      <EmptyStackHeader
        title="Program registry"
        onGoBack={() => {
          navigation.goBack();
        }}
      />
      <StyledView borderColor={theme.colors.BOX_OUTLINE} borderBottomWidth={1}></StyledView>
      <StyledView
        borderColor={theme.colors.BOX_OUTLINE}
        borderWidth={1}
        marginTop={20}
        marginBottom={10}
        marginLeft={20}
        marginRight={20}
        borderRadius={5}
      >
        <SearchInput
          value={searchValue}
          onChange={(text: string) => setSearchValue(text)}
          placeholder={'Search program registry...'}
        />
      </StyledView>
      <StyledView marginRight={20} marginLeft={20}>
        <FlatList
          data={programRegistries?.filter(x => {
            if (!searchValue) return true;
            return x.name.toLowerCase().includes(searchValue.toLowerCase());
          })}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => <ProgramRegistryListItem item={item} />}
        />
      </StyledView>
    </FullView>
  );
};
