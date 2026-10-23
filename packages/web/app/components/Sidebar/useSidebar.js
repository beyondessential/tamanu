import { CENTRAL_MENU_ITEMS } from './CentralMenuItems';
import { FACILITY_MENU_ITEMS } from './FacilityMenuItems';
import { useSettings } from '../../contexts/Settings';
import { useAuth } from '@tamanu/ui-components';

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

/**
 * Leaves out items for features the facility has turned off, or that the signed-in account
 * can't use, like the kiosk.
 */
const withoutUnavailableItems = (items, getSetting, checkAbility) =>
  items.map(item =>
    item.children
      ? {
          ...item,
          children: item.children.filter(
            child =>
              (!child.enabledBySetting || getSetting(child.enabledBySetting)) &&
              (!child.abilities?.length || child.abilities.some(checkAbility)),
          ),
        }
      : item,
  );

// This hook is used to get the menu items for the facility sidebar. It gets the configured hidden and
// sortPriority values from  sidebar config and merges them with the *_MENU_ITEMS constant
const useSidebarFactory = (ITEMS, configKey) => {
  const { getSetting } = useSettings();
  const { ability } = useAuth();

  const checkAbility = ({ action, subject }) => {
    return ability?.can?.(action, subject);
  };

  const sidebarConfig = getSetting(configKey);

  if (!sidebarConfig) {
    return withoutUnavailableItems(ITEMS, getSetting, checkAbility);
  }

  const items = ITEMS.reduce((topLevelItems, item) => {
    const localisedItem = sidebarConfig[item.key];
    if (!localisedItem) {
      topLevelItems.push(item);
      return topLevelItems;
    }
    if (localisedItem.hidden) return topLevelItems;

    let children = [];

    if (item.children) {
      children = item.children
        ?.reduce((childItems, child) => {
          const localisedChild = localisedItem[child.key];
          if (!localisedChild) {
            childItems.push(child);
          } else if (localisedChild.hidden) {
            // Skip
          } else {
            childItems.push({ ...child, sortPriority: localisedChild.sortPriority });
          }
          return childItems;
        }, [])
        .sort(sortChildItems);
    }

    if (item.abilities?.length > 0) {
      const hasAtLeastOneAbility = item.abilities.some(ability => checkAbility(ability));
      if (!hasAtLeastOneAbility) return topLevelItems;
      children = children.filter(child =>
        child.abilities?.length > 0 ? child.abilities.some(ability => checkAbility(ability)) : true,
      );
    }

    topLevelItems.push({
      ...item,
      sortPriority: localisedItem.sortPriority,
      ...(children.length > 0 && { children }),
    });
    return topLevelItems;
  }, []).sort(sortTopLevelItems);
  return withoutUnavailableItems(items, getSetting, checkAbility);
};

export const useFacilitySidebar = () => useSidebarFactory(FACILITY_MENU_ITEMS, 'layouts.sidebar');
export const useCentralSidebar = () =>
  useSidebarFactory(CENTRAL_MENU_ITEMS, 'layouts.centralSidebar');
