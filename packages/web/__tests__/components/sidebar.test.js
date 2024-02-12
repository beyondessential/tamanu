import { describe, expect, afterEach, it, vi } from 'vitest';
import { useFacilitySidebar } from '../../app/components/Sidebar/index.js';
import { useLocalisation } from '../../app/contexts/Localisation.jsx';

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

vi.mock('../../app/contexts/Localisation');

const localisationMock = config => ({
  getLocalisation: () => ({ ...defaultConfig, ...config }),
});

describe('useFacilitySidebar', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should display the correct items', () => {
    vi.mocked(useLocalisation).mockReturnValue(localisationMock());
    const items = useFacilitySidebar();
    expect(items.length).toBe(8);
    expect(items[0].key).toBe('patients');
    expect(items[0].children.length).toBe(4);
  });

  it('should hide top level items', () => {
    vi.mocked(useLocalisation).mockReturnValue(localisationMock({ patients: { hidden: true } }));
    const items = useFacilitySidebar();
    expect(items.length).toBe(7);
  });

  it('should hide secondary level items', () => {
    vi.mocked(useLocalisation).mockReturnValue(
      localisationMock({ patients: { patientsEmergency: { hidden: true } } }),
    );
    const items = useFacilitySidebar();
    expect(items[0].children.length).toBe(3);
  });

  it('should sort top level items', () => {
    vi.mocked(useLocalisation).mockReturnValue(
      localisationMock({ patients: { sortPriority: 10 } }),
    );
    const items = useFacilitySidebar();
    expect(items.map(item => item.key)).toStrictEqual([
      'scheduling',
      'medication',
      'imaging',
      'labs',
      'immunisations',
      'programRegistry',
      'patients',
      'facilityAdmin',
    ]);
  });

  it('should sort secondary level items', () => {
    vi.mocked(useLocalisation).mockReturnValue(
      localisationMock({
        patients: {
          patientsAll: {
            sortPriority: 3,
          },
          patientsInpatients: {
            sortPriority: 2,
          },
          patientsEmergency: {
            sortPriority: 1,
          },
          patientsOutpatients: {
            sortPriority: -1,
          },
        },
      }),
    );
    const items = useFacilitySidebar();
    expect(items[0].children.map(item => item.key)).toStrictEqual([
      'patientsOutpatients',
      'patientsEmergency',
      'patientsInpatients',
      'patientsAll',
    ]);
  });
});
