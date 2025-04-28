import React from 'react';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { FlatList } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { GreenTickIcon } from '~/ui/components/Icons';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { Row } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/RecentPatientSurveyReportStyled';
import { OptionType } from '~/ui/helpers/suggester';

interface ISelectModalScreen {
  navigation;
  route: {
    params: {
      callback: (item: any) => any;
      options: OptionType[];
      modalTitle: string;
      value: { label: string; value: string }[];
      searchPlaceholder?: string;
      onClickBack?: (navigation?: any) => void;
    };
  };
}

export const SelectModalScreen = (props: ISelectModalScreen) => {
  const {
    callback,
    options,
    modalTitle,
    onClickBack = () => props.navigation.goBack(),
  } = props.route.params;

  return (
    <FullView background={theme.colors.WHITE}>
      <EmptyStackHeader title={modalTitle} onGoBack={() => onClickBack(props.navigation)} />
      <StyledView borderColor={theme.colors.BOX_OUTLINE} borderBottomWidth={1}></StyledView>
      <StyledView marginRight={20} marginLeft={20} marginBottom={20}>
        <FlatList
          data={options}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <StyledTouchableOpacity
              key={item.value}
              onPress={() => {
                callback(item);
                props.navigation.goBack();
              }}
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
                  <StyledText fontSize={14} fontWeight={400}>
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
