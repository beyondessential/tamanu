import React from 'react';
import * as PalauComponents from './palau';
import { useSettings } from '../../contexts/Settings';
import { SETTING_KEYS } from '@tamanu/constants';

const ComponentList = {
  palau: PalauComponents,
};

/**
 * The `Customisations` component is a higher-order component (HOC) that allows for dynamic customization of child components based on settings.
 * It imports a set of components from the sub folders (.i.e palau) inside Customisations module and stores them in the `ComponentList` object.
 *
 * Inside the component, it retrieves the version of the component specified in the customizations settings.
 * The version is used as a key to access the corresponding component from the `ComponentList` object.
 * IMPORTANT: ensure your customized version in settings matches the key of the `ComponentList` object.
 *
 * Finally, if a matching component is found, it renders the component with the props from the `children` component.
 *
 * @param {ReactNode} children - The child component to be customized.
 * @returns {ReactNode} - The customized child component.
 * @example <Customisations><SampleButton onClick={() => null} /></Customisations>
 */
export const Customisations = ({ children }) => {
  const { getSetting } = useSettings();
  const settings = getSetting(SETTING_KEYS.CUSTOMISATIONS_COMPONENTS);

  const componentName = children?.type?.name;
  const props = children?.props;

  if (!settings) {
    return children;
  }

  const componentVersion = settings[componentName];
  const Component = ComponentList[componentVersion?.toLowerCase()]?.[componentName];

  if (!Component) return children;
  return <Component {...props} />;
};
