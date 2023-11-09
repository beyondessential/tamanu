import React, { useEffect, useState } from 'react';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { SearchInput } from '~/ui/components/SearchInput';
import { FlatList } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { GreenTickIcon } from '~/ui/components/Icons';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { Row } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/RecentPatientSurveyReportStyled';
import { Suggester, BaseModelSubclass } from '~/ui/helpers/suggester';

interface IMultiSelectModalScreen {
  navigation;
  route: {
    params: {
      callback: (item: any) => any;
      suggester: Suggester<BaseModelSubclass>;
      modalTitle: string;
      suggesterParams?: { [key: string]: any };
      value: { label: string; value: string }[];
    };
  };
}
export const MultiSelectModalScreen = (props: IMultiSelectModalScreen) => {
  const { callback, modalTitle, suggesterParams, suggester, value } = props.route.params;
  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState<{ value: string; label: string; selected: boolean }[]>([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetch(suggesterParams);
      setOptions(
        data.map((x: any) => {
          const selected = Array.isArray(value) && !!value.find(v => v.value === x.id);
          return { label: x.name, value: x.id, selected };
        }),
      );
    })();
  }, []);

  console.log(callback, modalTitle, suggesterParams, suggester, value);
  return (
    <FullView background={theme.colors.WHITE}>
      <EmptyStackHeader
        title={modalTitle}
        onGoBack={() => {
          props.navigation.goBack();
          callback(options.filter(x => x.selected));
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
          placeholder={'Search conditions...'}
        />
      </StyledView>
      <StyledView marginRight={20} marginLeft={20}>
        <FlatList
          data={options.filter(x => {
            if (!searchValue) return true;
            return x.label.toLowerCase().includes(searchValue.toLowerCase());
          })}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <StyledTouchableOpacity
              key={item.value}
              onPress={() =>
                setOptions(
                  options.map(x => ({
                    ...x,
                    selected: item.value === x.value ? !x.selected : x.selected,
                  })),
                )
              }
            >
              <StyledView marginRight={10} marginLeft={10} paddingTop={10} paddingBottom={10}>
                <Row
                  style={{
                    maxWidth: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}
                >
                  <StyledText fontSize={14} fontWeight={400} onPress={() => {}}>
                    {item.label}
                  </StyledText>
                  {item.selected && (
                    <GreenTickIcon
                      fill={theme.colors.PRIMARY_MAIN}
                      size={screenPercentageToDP('2.5', Orientation.Height)}
                    />
                  )}
                </Row>
              </StyledView>
            </StyledTouchableOpacity>
          )}
        />
      </StyledView>
    </FullView>
  );
};
