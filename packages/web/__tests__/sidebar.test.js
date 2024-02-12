import { describe, expect, afterEach, it, vi } from 'vitest';
import { useFacilitySidebar } from '../app/components/Sidebar';
import { useLocalisation } from '../app/contexts/Localisation';

const defaultConfig = {
  patients: {
    hidden: false,
    sort: -1000,
    patientsAll: {
      hidden: false,
      sort: 0,
    },
    patientsInpatients: {
      hidden: false,
      sort: 0,
    },
    patientsEmergency: {
      hidden: false,
      sort: 0,
    },
    patientsOutpatients: {
      hidden: false,
      sort: 0,
    },
  },
  scheduling: {
    hidden: false,
    sort: 0,
    schedulingAppointments: {
      hidden: false,
      sort: 0,
    },
    schedulingCalendar: {
      hidden: false,
      sort: 0,
    },
    schedulingNew: {
      hidden: false,
      sort: 0,
    },
  },
  medication: {
    hidden: false,
    sort: 0,
    medicationRequests: {
      hidden: false,
      sort: 0,
    },
  },
  imaging: {
    hidden: false,
    sort: 0,
    imagingActive: {
      hidden: false,
      sort: 0,
    },
    imagingCompleted: {
      hidden: false,
      sort: 0,
    },
  },
  labs: {
    hidden: false,
    sort: 0,
    labsRequests: {
      hidden: false,
      sort: 0,
    },
    labsPublished: {
      hidden: false,
      sort: 0,
    },
  },
  immunisations: {
    hidden: false,
    sort: 0,
    immunisationsAll: {
      hidden: false,
      sort: 0,
    },
  },
  programRegistry: {
    hidden: false,
    sort: 0,
  },
};

vi.mock('../app/contexts/Localisation');

const localisationMock = (config = defaultConfig) => ({
  getLocalisation: () => config,
});

describe.only('useFacilitySidebar', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it.only('should display the correct items', () => {
    vi.mocked(useLocalisation).mockReturnValue(localisationMock());
    const items = useFacilitySidebar();
    expect(items.length).toBe(8);
  });
  it.only('should hide top level items', () => {
    vi.mocked(useLocalisation).mockReturnValue(localisationMock({ patients: { hidden: true } }));
    const items = useFacilitySidebar();
    expect(items.length).toBe(7);
  });
  it('should hide secondary level items', () => {});
  it('should sort top level items', () => {});
  it('should sort secondary level items', () => {});
});
