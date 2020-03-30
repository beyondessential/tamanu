import React, { ReactElement, useMemo, useCallback, useState } from 'react';
import {
  RowView,
  StyledView,
  StyledText,
  FullView,
  CenterView,
} from '/styled/common';
import { Camera1 } from '/components/Icons/Camera1';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';
import { UserAvatar } from '/components/UserAvatar';
import { Button } from '/components/Button';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { FlatList } from 'react-native-gesture-handler';
import { Settings, Feedback, Question, Ring } from '/components/Icons';
import { version as AppVersion } from '/root/package.json';
import { StatusBar, StatusBarStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const CameraInCircle = (
  <StyledView position="absolute" right="-20%" bottom={0} zIndex={2}>
    <CenterView
      borderRadius={50}
      paddingTop={screenPercentageToDP('0.97', Orientation.Height)}
      paddingLeft={screenPercentageToDP('0.97', Orientation.Height)}
      paddingRight={screenPercentageToDP('0.97', Orientation.Height)}
      paddingBottom={screenPercentageToDP('0.97', Orientation.Height)}
      background={theme.colors.TEXT_SOFT}
    >
      <Camera1
        height={screenPercentageToDP('2.43', Orientation.Height)}
        width={screenPercentageToDP('2.43', Orientation.Height)}
        fill={theme.colors.WHITE}
      />
    </CenterView>
  </StyledView>
);

type TamanuAppVersionProps = {
  version: string;
};

const TamanuAppVersion = ({ version }: TamanuAppVersionProps): ReactElement => (
  <StyledText
    marginTop={screenPercentageToDP(2.43, Orientation.Height)}
    marginLeft={screenPercentageToDP(4.86, Orientation.Width)}
    color={theme.colors.TEXT_MID}
    fontSize={screenPercentageToDP(1.45, Orientation.Height)}
  >
    Tamanu Version {version}
  </StyledText>
);

const mock = {
  size: screenPercentageToDP('9.72', Orientation.Height),
  name: 'Alice Klein',
  gender: 'female',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  Icon: CameraInCircle,
};

export const MoreScreen = (): ReactElement => {
  const settings = useMemo(
    () => [
      {
        title: 'Settings',
        Icon: Settings,
        onPress: (): void => console.log('Settings'),
      },
      {
        title: 'Feedback',
        Icon: Feedback,
        onPress: (): void => console.log('Feedback'),
      },
      {
        title: 'FAQs',
        Icon: Question,
        onPress: (): void => console.log('Question'),
      },
      {
        title: 'Notifications',
        Icon: Ring,
        onPress: (): void => console.log('Notification'),
      },
    ],
    [],
  );

  const signOut = useCallback(() => {
    console.log('signing out....');
  }, []);

  const [barStyle, setbarStyle] = useState<StatusBarStyle>('dark-content');

  useFocusEffect(
    useCallback(() => {
      setbarStyle('dark-content');
      return (): void => setbarStyle('light-content');
    }, []),
  );

  return (
    <FullView>
      <StatusBar barStyle={barStyle} />
      <CenterView
        height={screenPercentageToDP(31.59, Orientation.Height)}
        paddingTop={40}
        background={theme.colors.BACKGROUND_GREY}
      >
        <UserAvatar {...mock} />
        <StyledText
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          color={theme.colors.TEXT_SUPER_DARK}
          fontWeight="bold"
        >
          {mock.name}
        </StyledText>
        <RowView alignItems="center">
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.TEXT_SUPER_DARK}
          >
            Nurse
          </StyledText>
          <StyledView
            height={screenPercentageToDP(0.486, Orientation.Height)}
            width={screenPercentageToDP(0.486, Orientation.Height)}
            borderRadius={50}
            background={theme.colors.TEXT_SUPER_DARK}
            marginLeft={screenPercentageToDP(0.72, Orientation.Width)}
            marginRight={screenPercentageToDP(0.72, Orientation.Width)}
          />
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.TEXT_SUPER_DARK}
          >
            Victoria Hospital
          </StyledText>
        </RowView>
        <Button
          marginTop={screenPercentageToDP(1.21, Orientation.Height)}
          width={screenPercentageToDP(29.19, Orientation.Width)}
          height={screenPercentageToDP(6.07, Orientation.Height)}
          buttonText="Sign Out"
          onPress={signOut}
          outline
          borderColor={theme.colors.PRIMARY_MAIN}
        />
      </CenterView>
      <StyledView background={theme.colors.WHITE} flex={1}>
        <StyledView>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={settings}
            keyExtractor={(item): string => item.title}
            renderItem={({ item }): ReactElement => (
              <MenuOptionButton {...item} fontWeight={500} />
            )}
            ItemSeparatorComponent={Separator}
            ListFooterComponent={Separator}
          />
        </StyledView>
        <TamanuAppVersion version={AppVersion} />
      </StyledView>
    </FullView>
  );
};
