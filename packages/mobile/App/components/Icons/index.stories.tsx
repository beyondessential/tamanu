import React from 'react';
import { storiesOf } from '@storybook/react-native';
import * as Icons from './index';
import { CenterView } from '../../styled/common';
import { theme } from '../../styled/theme';

const stories = storiesOf('Icons', module);

stories.addDecorator((getStory: Function) => (
  <CenterView>{getStory()}</CenterView>
));
stories.add('Alert', () => <Icons.Alert />);
stories.add('AppIntro1', () => <Icons.AppIntro1 />);
stories.add('AppIntro2', () => <Icons.AppIntro2 />);
stories.add('AppIntro3', () => <Icons.AppIntro3 />);
stories.add('Appoitments', () => <Icons.Appointments />);
stories.add('ArrowBack', () => <Icons.ArrowBack />);
stories.add('ArrowDown', () => <Icons.ArrowDown />);
stories.add('ArrowForward', () => <Icons.ArrowForward />);
stories.add('ArrowUp', () => <Icons.ArrowUp />);
stories.add('Avatar', () => <Icons.Avatar />);
stories.add('Avatar_10', () => <Icons.Avatar10 />);
stories.add('Avatar_11', () => <Icons.Avatar11 />);
stories.add('Avatar_12', () => <Icons.Avatar12 />);
stories.add('BarChart', () => (
  <CenterView width="100%" background={theme.colors.TEXT_DARK}>
    <Icons.BarChart />
  </CenterView>
));
stories.add('SickOrInjured', () => <Icons.SickOrInjured />);
stories.add('Camera1', () => <Icons.Camera1 />);
stories.add('CircleAdd', () => <Icons.CircleAdd />);
stories.add('Clipboard', () => <Icons.Clipboard />);
stories.add('Checked', () => <Icons.Checked />);
stories.add('CheckUp', () => <Icons.CheckUp />);
stories.add('Deceased', () => <Icons.Deceased />);
stories.add('FamilyPlanning', () => <Icons.FamilyPlanning />);
stories.add('Feedback', () => <Icons.Feedback />);
stories.add('FirstAidKit', () => <Icons.FirstAidKit />);
stories.add('Folder', () => <Icons.Folder />);
stories.add('Forward', () => <Icons.Forward />);
stories.add('Group', () => <Icons.Group />);
stories.add('Heart', () => <Icons.Heart />);
stories.add('HeartOutline', () => <Icons.HeartOutline />);
stories.add('History', () => <Icons.History />);
stories.add('Location', () => <Icons.Location />);
stories.add('LogoV1', () => <Icons.LogoV1 />);
stories.add('BottomNavLogo', () => <Icons.BottomNavLogo />);
stories.add('LogoV1_CLR', () => <Icons.LogoV1CLR />);
stories.add('LogoV2CLR', () => <Icons.LogoV2CLR />);
stories.add('LogoRev', () => <Icons.LogoRev />);
stories.add('Medicine', () => <Icons.Medicine />);
stories.add('More', () => <Icons.More />);
stories.add('NotTaken', () => <Icons.NotTaken />);
stories.add('Notepad', () => <Icons.Notepad />);
stories.add('OptionsGlyph', () => <Icons.OptionsGlyph />);
stories.add('Pencil', () => <Icons.Pencil />);
stories.add('Pregnancy', () => <Icons.Pregnancy />);
stories.add('Profile', () => <Icons.Profile />);
stories.add('Question', () => <Icons.Question />);
stories.add('Recruiter', () => <Icons.Recruiter />);
stories.add('Ring', () => <Icons.Ring />);
stories.add('RotatePhone', () => <Icons.RotatePhone />);
stories.add('Scheduled Vaccine', () => <Icons.ScheduledVaccine />);
stories.add('Settings', () => <Icons.Settings />);
stories.add('Stethoscope', () => <Icons.Stethoscope />);
stories.add('Sync', () => <Icons.Sync />);
stories.add('SyncFiles', () => <Icons.SyncFiles />);
stories.add('TakenNotOnTime', () => <Icons.TakenNotOnTime />);
stories.add('TakenOnTime', () => <Icons.TakenOnTime />);
stories.add('User', () => (
  <Icons.User
    stroke={theme.colors.MAIN_SUPER_DARK}
    fill={theme.colors.MAIN_SUPER_DARK}
  />
));
stories.add('User with color', () => (
  <Icons.User
    stroke={theme.colors.SECONDARY_MAIN}
    fill={theme.colors.SECONDARY_MAIN}
  />
));
stories.add('Vaccine', () => <Icons.Vaccine />);
stories.add('NullValueCell', () => <Icons.NullValueCell />);
