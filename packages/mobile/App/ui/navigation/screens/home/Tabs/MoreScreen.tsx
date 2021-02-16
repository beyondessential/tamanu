import React, {
  ReactElement,
  useMemo,
  useCallback,
  useState,
  useContext,
} from 'react';
import { useSelector } from 'react-redux';
import {
  RowView,
  StyledView,
  StyledText,
  FullView,
  CenterView,
} from '/styled/common';
import {
  screenPercentageToDP,
  Orientation,
  setStatusBar,
} from '/helpers/screen';
import { theme } from '/styled/theme';
import { UserAvatar } from '/components/UserAvatar';
import { Button } from '/components/Button';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { FlatList } from 'react-native-gesture-handler';
import {
  CameraOutlineIcon,
  SettingsIcon,
  FeedbackIcon,
  QuestionIcon,
  RingIcon,
} from '/components/Icons';
import { version as AppVersion } from '/root/package.json';
import { StatusBar, StatusBarStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '~/ui/contexts/AuthContext';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { authUserSelector } from '/helpers/selectors';

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
      <CameraOutlineIcon
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

export const MoreScreen = ({ navigation }: BaseAppProps): ReactElement => {
  const authCtx = useContext(AuthContext);
  const user = useSelector(authUserSelector);
  const settings = useMemo(
    () => [
      {
        title: 'Settings',
        Icon: SettingsIcon,
        onPress: (): void => console.log('Settings'),
      },
      {
        title: 'Feedback',
        Icon: FeedbackIcon,
        onPress: (): void => console.log('Feedback'),
      },
      {
        title: 'FAQs',
        Icon: QuestionIcon,
        onPress: (): void => console.log('Question'),
      },
      {
        title: 'Notifications',
        Icon: RingIcon,
        onPress: (): void => console.log('Notification'),
      },
    ],
    [],
  );

  const signOut = useCallback(() => {
    authCtx.signOut();
  }, []);

  setStatusBar('dark-content', theme.colors.BACKGROUND_GREY);

  return (
    <FullView>
      <CenterView
        height={screenPercentageToDP(31.59, Orientation.Height)}
        paddingTop={screenPercentageToDP(4.86, Orientation.Height)}
        background={theme.colors.BACKGROUND_GREY}
      >
        <UserAvatar
          size={screenPercentageToDP(9.72, Orientation.Height)}
          displayName={user && user.displayName}
          Icon={CameraInCircle}
        />
        <StyledText
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          color={theme.colors.TEXT_SUPER_DARK}
          fontWeight="bold"
        >
          {user && user.displayName}
        </StyledText>
        <RowView alignItems="center">
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.TEXT_SUPER_DARK}
          >
            {user && user.role}
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
            {user.facility.name}
          </StyledText>
        </RowView>
        <Button
          marginTop={screenPercentageToDP(1.21, Orientation.Height)}
          width={screenPercentageToDP(29.19, Orientation.Width)}
          height={screenPercentageToDP(6.07, Orientation.Height)}
          buttonText="Sign out"
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
