import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '~/ui/helpers/routes';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { SearchInput } from '~/ui/components/SearchInput';
import { FlatList } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { EmptyStackHeader } from '~/ui/components/StackHeader';

export const PatientProgramRegistryForm1 = () => {
  const navigation = useNavigation();
  const [searchValue, setSearchValue] = useState('');

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
          data={[
            { id: 1, name: 'Hepatitis A' },
            { id: 2, name: 'Hepatitis B' },
            { id: 3, name: 'Hepatitis C' },
          ].filter(x => {
            if (!searchValue) return true;
            return x.name.includes(searchValue);
          })}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <StyledTouchableOpacity onPress={() => {}}>
              <StyledView marginRight={20} marginLeft={20} paddingTop={10} paddingBottom={10}>
                <StyledText
                  fontSize={14}
                  fontWeight={400}
                  onPress={() => {
                    navigation.navigate(
                      Routes.HomeStack.PatientProgramRegistryFormStack.PatientProgramRegistryForm,
                      { programRegistry: item },
                    );
                  }}
                >
                  {item.name}
                </StyledText>
              </StyledView>
            </StyledTouchableOpacity>
          )}
        />
      </StyledView>
    </FullView>
  );
};
