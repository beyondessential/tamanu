export const Routes = {
  Autocomplete: {
    name: 'Autocomplete',
    Modal: 'Modal',
  },
  SignUpStack: {
    name: 'SignUpStack',
    Intro: 'Intro',
    RegisterAccountStep1: 'RegisterAccountStep1',
    RegisterAccountStep2: 'RegisterAccountStep2',
    RegisterAccountStep3: 'RegisterAccountStep3',
    SignIn: 'SignIn',
  },
  HomeStack: {
    name: 'HomeStack',
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
    HomeTabs: {
      name: 'HomeTabs',
      Home: 'Home',
      Reports: 'Reports',
      SyncData: 'SyncData',
      More: 'More',
    },
    CheckUpStack: {
      name: 'CheckUpStack',
      CheckUpTabs: {
        name: 'CheckUpTabs',
        AddDetails: 'AddDetails',
        ViewHistory: 'ViewHistory',
        CreateEncounter: 'CreateEncounter',
      },
    },
    ProgramStack: {
      name: 'ProgramStack',
      ProgramListScreen: 'ProgramListScreen',
      SurveyResponseDetailsScreen: 'SurveyResponseDetailsScreen',
      ProgramTabs: {
        name: 'ProgramTabs',
        AddDetails: 'AddProgramDetails',
        ViewHistory: 'ViewProgramHistory',
      },
    },
    ReferralTabs: {
      name: 'ReferralTabs',
      AddReferralDetails: 'AddReferralDetails',
      ViewHistory: 'ViewHistory',
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
    SickOrInjuredTabs: {
      name: 'SickOrInjuredTabs',
      AddSickDetailScreen: 'AddSickDetailScreen',
      ViewHistory: 'ViewHistory',
    },
    DeceasedStack: {
      name: 'DeceasedStack',
      AddDeceasedDetails: 'AddDeceasedDetails',
    },
    HistoryVitalsStack: {
      name: 'HistoryVitalsStack',
      HistoryVitalsTabs: {
        name: 'HistoryVitalsTabs',
        Visits: 'Visits',
        Vitals: 'Vitals',
        Vaccines: 'Vaccines',
      },
    },
    RegisterPatientStack: {
      name: 'RegisterPatientStack',
      PatientPersonalInfo: 'PatientPersonalInfo',
      PatientSpecificInfo: 'PatientSpecificInfo',
      NewPatient: 'NewPatient',
    },
    PatientDetails: 'PatientDetails',
    PatientActions: 'PatientActions',
    ExportDataScreen: 'ExportDataScreen',
  },
};
