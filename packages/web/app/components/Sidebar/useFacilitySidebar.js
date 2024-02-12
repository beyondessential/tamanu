import { FACILITY_MENU_ITEMS } from './config';
import { useLocalisation } from '../../contexts/Localisation';

const tempLocalisation = {
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

const sortTopLevelItems = (a, b) => {
  // Always show facilityAdmin last
  if (a.key === 'facilityAdmin') {
    return 1;
  }
  return a.sort - b.sort;
};

export const useFacilitySidebar = () => {
  const { getLocalisation } = useLocalisation();
  // const sidebarConfig = getLocalisation('sidebar');
  const sidebarConfig = tempLocalisation;

  const output = FACILITY_MENU_ITEMS.reduce((topLevelItems, item) => {
    const localisedItem = sidebarConfig[item.key];

    if (!localisedItem) {
      return [...topLevelItems, item];
    }

    const { sort, hidden } = localisedItem;

    if (hidden) {
      return topLevelItems;
    }

    let children = [];

    if (item.children) {
      children = item.children
        ?.reduce((childItems, child) => {
          const localisedChild = localisedItem[child.key];
          if (!localisedChild) {
            return [...childItems, child];
          }
          const { hidden, sort } = localisedChild;

          if (hidden) {
            return childItems;
          }

          return [...childItems, { ...child, sort }];
        }, [])
        .sort((a, b) => a.sort - b.sort);
    }

    return [...topLevelItems, { ...item, sort, children }];
  }, []).sort(sortTopLevelItems);

  return output;
};
