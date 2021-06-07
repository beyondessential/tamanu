// NOTE
// All of the values on this object will be automatically assigned by a
// function at the end of this file.
// For eg: HomeStack.VaccineStack.VaccineModalScreen will be set to
// /HomeStack/VaccineStack/VaccineModalScreen
//
// So - don't worry about the actual value of any of the routes (empty
// string is fine).

export const Routes = {
  Autocomplete: {
    Index: '',
    Modal: '',
  },
  SignUpStack: {
    Index: '',
    Intro: '',
    RegisterAccountStep1: '',
    RegisterAccountStep2: '',
    RegisterAccountStep3: '',
    SignIn: '',
    ResetPassword: '',
    ChangePassword: '',
  },
  HomeStack: {
    Index: '',
    WelcomeIntroStack: '',
    VaccineStack: {
      Index: '',
      VaccineTabs: {
        Index: '',
        Routine: '',
        Catchup: '',
        Campaign: '',
      },
      NewVaccineTabs: {
        Index: '',
        GivenOnTimeTab: '',
        NotTakeTab: '',
      },
      VaccineModalScreen: '',
    },
    HomeTabs: {
      Index: '',
      Home: '',
      Reports: '',
      SyncData: '',
      More: '',
    },
    CheckUpStack: {
      Index: '',
      CheckUpTabs: {
        Index: '',
        AddDetails: '',
        ViewHistory: '',
      },
    },
    ProgramStack: {
      Index: '',
      ProgramListScreen: '',
      SurveyResponseDetailsScreen: '',
      ProgramTabs: {
        Index: '',
        AddDetails: '',
        ViewHistory: '',
      },
      ReferralTabs: {
        Index: '',
        AddReferralDetails: '',
        ViewHistory: '',
      },
    },
    SearchPatientStack: {
      Index: '',
      SearchPatientTabs: {
        Index: '',
        RecentViewed: '',
        ViewAll: '',
      },
      FilterSearch: '',
    },
    SickOrInjuredTabs: {
      Index: '',
      AddIllnessScreen: '',
      PrescribeMedication: '',
      ViewHistory: '',
    },
    DeceasedStack: {
      Index: '',
      AddDeceasedDetails: '',
    },
    HistoryVitalsStack: {
      Index: '',
      HistoryVitalsTabs: {
        Index: '',
        Visits: '',
        Vitals: '',
        Vaccines: '',
      },
    },
    RegisterPatientStack: {
      Index: '',
      PatientPersonalInfo: '',
      PatientSpecificInfo: '',
      NewPatient: '',
    },
    PatientDetailsStack: {
      Index: '',
      AddPatientIssue: '',
    },
    PatientActions: '',
    ExportDataScreen: '',
  },
};

// this function is set up to reassign the values on Routes in-place
// rather than recreate the object (like how [].reduce would) so that
// we can still benefit from VS Code knowing the structure at build time,
// and providing autocompletes etc.
//
export function transformRoutes(baseKey, routes): void {
  Object.keys(routes).map(k => {
    const val = routes[k];
    const routeString = [baseKey, k].join('/');
    if (typeof val === 'object') {
      transformRoutes(routeString, val);
      return;
    }

    routes[k] = routeString;
  });
}

transformRoutes('', Routes);
