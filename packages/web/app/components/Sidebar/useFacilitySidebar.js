import { FACILITY_MENU_ITEMS } from './config';
import { useLocalisation } from '../../contexts/Localisation';

const sortTopLevelItems = (a, b) => {
  // Always show facilityAdmin last
  if (a.key === 'facilityAdmin') {
    return 1;
  }
  return a.sortPriority - b.sortPriority;
};

export const useFacilitySidebar = () => {
  const { getLocalisation } = useLocalisation();
  const sidebarConfig = getLocalisation('sidebar');
  console.log('sidebarConfig', sidebarConfig);

  return FACILITY_MENU_ITEMS.reduce((topLevelItems, item) => {
    const localisedItem = sidebarConfig[item.key];
    if (!localisedItem) {
      return [...topLevelItems, item];
    }

    const { sortPriority, hidden } = localisedItem;

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
          const { hidden, sortPriority } = localisedChild;

          if (hidden) {
            return childItems;
          }

          return [...childItems, { ...child, sortPriority }];
        }, [])
        .sort((a, b) => a.sortPriority - b.sortPriority);
    }

    return [...topLevelItems, { ...item, sortPriority, children }];
  }, []).sort(sortTopLevelItems);
};
