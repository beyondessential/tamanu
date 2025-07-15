// NOTE
// All of the values on this object will be automatically assigned by a
// function at the end of this file.
// For eg: HomeStack.VaccineStack.VaccineModalScreen will be set to
// /HomeStack/VaccineStack/VaccineModalScreen
//
// So - don't worry about the actual value of any of the routes (empty
// string is fine).

export const Routes = {
  Forms: {
    Index: '',
    AutocompleteModal: '',
    MultiSelectModal: '',
    SelectModal: '',
    FrequencySearchModal: '',
  },
  SignUpStack: {
    Index: '',
    Intro: '',
    RegisterAccountStep1: '',
    RegisterAccountStep2: '',
    RegisterAccountStep3: '',
    SignIn: '',
    SelectFacility: '',
    ResetPassword: '',
    ChangePassword: '',
    LanguageSelect: '',
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
    VitalsStack: {
      Index: '',
      VitalsTabs: {
        Index: '',
        AddDetails: '',
        ViewHistory: '',
      },
    },
    ProgramStack: {
      Index: '',
      SurveyResponseDetailsScreen: '',
      ProgramTabs: {
        Index: '',
        SurveyTabs: {
          Index: '',
          AddDetails: '',
          ViewHistory: '',
        },
      },
    },
    ReferralStack: {
      Index: '',
      ReferralList: {
        Index: '',
        AddReferralDetails: '',
      },
      ViewHistory: {
        Index: '',
        SurveyResponseDetailsScreen: '',
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
    DiagnosisAndTreatmentTabs: {
      Index: '',
      AddIllnessScreen: '',
      PrescribeMedication: '',
      ViewHistory: '',
    },
    LabRequestStack: {
      Index: '',
      LabRequestTabs: {
        ViewHistory: '',
        NewRequest: '',
      },
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
    PatientSummaryStack: {
      Index: '',
    },
    PatientProgramRegistryFormStack: {
      Index: '',
      PatientProgramRegistryForm: '',
    },
    PatientProgramRegistrationDetailsStack: {
      Index: '',
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
      ReminderContacts: '',
      AddReminderContact: '',
      ReminderContactQR: '',
      EditPatient: '',
      EditPatientAdditionalData: '',
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
  Object.keys(routes).map((k) => {
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
