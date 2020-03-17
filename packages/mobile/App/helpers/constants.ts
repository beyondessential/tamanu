import * as Icons from '../components/Icons';
import { theme } from '../styled/theme';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DAY_MONTH: 'dd MMM',
  DDMMYY: 'dd/MM/yyyy',
  SHORT_MONTH: 'MMM',
};

export const TimeFormats = {
  HHMMSS: 'pp',
};

export const FilterTypeAll = 'All';

export const VisitTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  VISIT: 'Visit',
};

export const HeaderIcons = {
  [VisitTypes.CLINIC]: Icons.Clipboard,
  [VisitTypes.HOSPITAL]: Icons.FirstAidKit,
  [VisitTypes.VISIT]: Icons.Stethoscope,
};

export const PatientVitalsList = [
  'bloodPressure',
  'weight',
  'circumference',
  'sp02',
  'heartRate',
  'fev',
  'cholesterol',
  'bloodGlucose',
];

export const VaccineStatus = {
  TAKEN: 'TAKEN',
  TAKEN_NOT_ON_TIME: 'TAKEN_NOT_ON_TIME',
  NOT_TAKEN: 'NOT_TAKEN',
  SCHEDULED: 'SCHEDULED',
};

export const VaccineIcons = {
  [VaccineStatus.TAKEN]: {
    Icon: Icons.Checked,
    color: theme.colors.SAFE,
    text: 'TAKEN ON TIME',
  },
  [VaccineStatus.NOT_TAKEN]: {
    Icon: Icons.NotTaken,
    color: theme.colors.TEXT_SOFT,
    text: 'NOT TAKEN',
  },
  [VaccineStatus.TAKEN_NOT_ON_TIME]: {
    Icon: Icons.TakenNotOnTime,
    color: theme.colors.ORANGE,
    text: 'TAKEN NOT ON TIME',
  },
  [VaccineStatus.SCHEDULED]: {
    Icon: Icons.ScheduledVaccine,
    color: theme.colors.ORANGE,
    text: 'SCHEDULED',
  },
};

export const SCREEN_ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

export const Routes = {
  SignUpStack: {
    name: 'SignUpStack',
    Intro: 'Intro',
    RegisterAccountStep1: 'RegisterAccountStep1',
    RegisterAccountStep2: 'RegisterAccountStep2',
    RegisterAccountStep3: 'RegisterAccountStep3',
    SignIn: 'SignIn',
  },
  HomeStack: {
    WelcomeIntroStack: 'WelcomeIntroStack',
    VaccineStack: {
      name: 'VaccineStack',
      VaccineTabs: {
        name: 'VaccineTabs',
        ChildhoodTab: 'ChildhoodTab',
        AdolescentTab: 'AdolescentTab',
        AdulTab: 'AdultTab',
      },
      NewVaccineTabs: {
        name: 'NewVaccineTabs',
        TakenOnTimeTab: 'TakenOnTimeTab',
        TakenNotOnTimeTab: 'TakenNotOnTimeTab',
        NotTakeTab: 'NotTakeTab',
      },
      VaccineModalScreen: 'VaccineModalScreen',
    },
    name: 'HomeStack',
    HomeTabs: {
      name: 'HomeTabs',
      Home: 'Home',
      Reports: 'Reports',
      More: 'More',
      SyncData: 'SyncData',
    },
    SearchPatientStack: {
      name: 'SearchPatientStack',
      SearchPatientTabs: {
        name: 'SearchPatientTabs',
        RecentViewed: 'RecentViewed',
        ViewAll: 'ViewAll',
      },
      FilterSearch: 'FilterSearch',
    },
    PatientDetails: 'PatientDetails',
  },
};

export const PhoneMask = { mask: '9999 9999 999' };

export const MaleGender = {
  label: 'Male',
  value: 'male',
};

export const OtherGender = {
  label: 'Other',
  value: 'other',
};

export const FemaleGender = {
  label: 'Female',
  value: 'female',
};

export const GenderOptions = [MaleGender, FemaleGender, OtherGender];
