import React, { useState } from 'react';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { SearchInput } from '~/ui/components/SearchInput';
import { FlatList } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { Row } from '../home/Tabs/PatientHome/ReportScreen/RecentPatientSurveyReportStyled';
import { GreenTickIcon } from '~/ui/components/Icons';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

interface IConditionMultiSelect {
  navigation;
  route: {
    params: {
      options: { label: string; value: string };
      callback: (item: any) => any;
    };
  };
}
export const ConditionMultiselect = (props: IConditionMultiSelect) => {
  const { callback } = props.route.params;
  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState<{ value: string; label: string; selected: boolean }[]>([
    { value: '1', label: 'Acute bronchitis', selected: false },
    { value: '2', label: 'Acute colitis', selected: false },
    { value: '3', label: 'Asthma', selected: false },
    { value: '4', label: 'Cancer', selected: false },
    { value: '5', label: 'Chronic kidney disease', selected: false },
    { value: '6', label: 'Ebola', selected: false },
    { value: '7', label: 'Giardiasis', selected: false },
    { value: '8', label: 'Infection', selected: false },
    { value: '9', label: 'Meningitis', selected: false },
    { value: '10', label: 'Salmonellosis', selected: false },
    { value: '11', label: 'Tuberculosis', selected: false },
    { value: '12', label: 'UTI', selected: false },
    { value: '13', label: 'Vascular disease', selected: false },
  ]);

  return (
    <FullView background={theme.colors.WHITE}>
      <EmptyStackHeader
        title="Conditions"
        onGoBack={() => {
          props.navigation.goBack();
          callback({
            value: options
              .filter(x => x.selected)
              .map(x => x.value)
              .toString(),
            label: options
              .filter(x => ` ${x.selected}`)
              .map(x => x.label)
              .toString(),
          });
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
