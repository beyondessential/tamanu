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
    name: '',
    Modal: '',
  },
  SignUpStack: {
    name: '',
    Intro: '',
    RegisterAccountStep1: '',
    RegisterAccountStep2: '',
    RegisterAccountStep3: '',
    SignIn: '',
  },
  HomeStack: {
    name: '',
    WelcomeIntroStack: '',
    VaccineStack: {
      name: '',
      VaccineTabs: {
        name: '',
        ChildhoodTab: '',
        AdolescentTab: '',
        AdultTab: '',
      },
      NewVaccineTabs: {
        name: '',
        TakenOnTimeTab: '',
        TakenNotOnTimeTab: '',
        NotTakeTab: '',
      },
      VaccineModalScreen: '',
    },
    HomeTabs: {
      name: '',
      Home: '',
      Reports: '',
      SyncData: '',
      More: '',
    },
    CheckUpStack: {
      name: '',
      CheckUpTabs: {
        name: '',
        AddDetails: '',
        ViewHistory: '',
        CreateEncounter: '',
      },
    },
    ProgramStack: {
      name: '',
      ProgramListScreen: '',
      SurveyResponseDetailsScreen: '',
      ProgramTabs: {
        name: '',
        AddDetails: '',
        ViewHistory: '',
      },
    },
    ReferralTabs: {
      name: '',
      AddReferralDetails: '',
      ViewHistory: '',
    },
    SearchPatientStack: {
      name: '',
      SearchPatientTabs: {
        name: '',
        RecentViewed: '',
        ViewAll: '',
      },
      FilterSearch: '',
    },
    SickOrInjuredTabs: {
      name: '',
      AddIllnessScreen: '',
      ViewHistory: '',
    },
    DeceasedStack: {
      name: '',
      AddDeceasedDetails: '',
    },
    HistoryVitalsStack: {
      name: '',
      HistoryVitalsTabs: {
        name: '',
        Visits: '',
        Vitals: '',
        Vaccines: '',
      },
    },
    RegisterPatientStack: {
      name: '',
      PatientPersonalInfo: '',
      PatientSpecificInfo: '',
      NewPatient: '',
    },
    PatientDetails: '',
    PatientActions: '',
    ExportDataScreen: '',
  },
};


// this function is set up to reassign the values on Routes in-place
// rather than recreate the object (like how [].reduce would) so that
// we can still benefit from VS Code knowing the structure at build time,
// and providing autocompletes etc.
//
function transformRoutes(baseKey, routes) {
  Object.keys(routes).map(k => {
    const val = routes[k];
    const routeString = [baseKey, k].join('/');
    if(typeof val === "object") {
      transformRoutes(routeString, val);
      return;
    }

    routes[k] = routeString;
  });
}

transformRoutes('', Routes);

