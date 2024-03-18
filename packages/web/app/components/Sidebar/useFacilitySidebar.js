import { FACILITY_MENU_ITEMS } from './config';
import { useLocalisation } from '../../contexts/Localisation';

const sortTopLevelItems = (a, b) => {
  // Always show patients first
  if (a.key === 'patients') {
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
// sortPriority values from  sidebar config and merges them with the FACILITY_MENU_ITEMS constant
export const useFacilitySidebar = () => {
  const { getLocalisation } = useLocalisation();
  const sidebarConfig = getLocalisation('layouts.sidebar');

  if (!sidebarConfig) {
    return FACILITY_MENU_ITEMS;
  }

  return FACILITY_MENU_ITEMS.reduce((topLevelItems, item) => {
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

    return [...topLevelItems, { ...item, sortPriority: localisedItem.sortPriority, children }];
  }, []).sort(sortTopLevelItems);
};
