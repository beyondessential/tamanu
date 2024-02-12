import { describe, expect, afterEach, it, vi } from 'vitest';
import { useFacilitySidebar } from '../app/components/Sidebar';
import { useLocalisation } from '../app/contexts/Localisation';

const defaultConfig = {
  patients: {
    hidden: false,
    sortPriority: -1000,
    patientsAll: {
      hidden: false,
      sortPriority: 0,
    },
    patientsInpatients: {
      hidden: false,
      sortPriority: 0,
    },
    patientsEmergency: {
      hidden: false,
      sortPriority: 0,
    },
    patientsOutpatients: {
      hidden: false,
      sortPriority: 0,
    },
  },
  scheduling: {
    hidden: false,
    sortPriority: 0,
    schedulingAppointments: {
      hidden: false,
      sortPriority: 0,
    },
    schedulingCalendar: {
      hidden: false,
      sortPriority: 0,
    },
    schedulingNew: {
      hidden: false,
      sortPriority: 0,
    },
  },
  medication: {
    hidden: false,
    sortPriority: 0,
    medicationRequests: {
      hidden: false,
      sortPriority: 0,
    },
  },
  imaging: {
    hidden: false,
    sortPriority: 0,
    imagingActive: {
      hidden: false,
      sortPriority: 0,
    },
    imagingCompleted: {
      hidden: false,
      sortPriority: 0,
    },
  },
  labs: {
    hidden: false,
    sortPriority: 0,
    labsRequests: {
      hidden: false,
      sortPriority: 0,
    },
    labsPublished: {
      hidden: false,
      sortPriority: 0,
    },
  },
  immunisations: {
    hidden: false,
    sortPriority: 0,
    immunisationsAll: {
      hidden: false,
      sortPriority: 0,
    },
  },
  programRegistry: {
    hidden: false,
    sortPriority: 0,
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
