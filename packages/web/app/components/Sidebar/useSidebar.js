import { CENTRAL_MENU_ITEMS } from './CentralMenuItems';
import { FACILITY_MENU_ITEMS } from './FacilityMenuItems';
import { useLocalisation } from '../../contexts/Localisation';

const sortTopLevelItems = (a, b) => {
  // Always show dashboard first
  if (a.key === 'dashboard') {
    return -1;
  }
  return a.sortPriority - b.sortPriority;
};

const sortChildItems = (a, b) => {
  // Always show all patients first
  if (a.key === 'patientsAll') {
    return -1;
  }
  return a.sortPriority - b.sortPriority;
};

// This hook is used to get the menu items for the facility sidebar. It gets the configured hidden and
// sortPriority values from  sidebar config and merges them with the *_MENU_ITEMS constant
const useSidebarFactory = (ITEMS, configKey) => {
  const { getLocalisation } = useLocalisation();
  const sidebarConfig = getLocalisation(configKey);

  if (!sidebarConfig) {
    return ITEMS;
  }

  return ITEMS.reduce((topLevelItems, item) => {
    const localisedItem = sidebarConfig[item.key];
    if (!localisedItem) return [...topLevelItems, item];
    if (localisedItem.hidden) return topLevelItems;

    let children = [];

    if (item.children) {
      children = item.children
        ?.reduce((childItems, child) => {
          const localisedChild = localisedItem[child.key];
          if (!localisedChild) return [...childItems, child];
          if (localisedChild.hidden) return childItems;

          return [...childItems, { ...child, sortPriority: localisedChild.sortPriority }];
        }, [])
        .sort(sortChildItems);
    }

    return [
      ...topLevelItems,
      {
        ...item,
        sortPriority: localisedItem.sortPriority,
        ...(children.length > 0 && { children }),
      },
    ];
  }, []).sort(sortTopLevelItems);
};

export const useFacilitySidebar = () => useSidebarFactory(FACILITY_MENU_ITEMS, 'layouts.sidebar');
export const useCentralSidebar = () =>
  useSidebarFactory(CENTRAL_MENU_ITEMS, 'layouts.centralSidebar');
