import React from 'react';
import * as PalauComponents from './palau';
import * as FSMComponents from './fsm';
import { useSettings } from '../../contexts/Settings';
import { SETTING_KEYS } from '@tamanu/constants';

const ComponentList = {
  palau: PalauComponents,
  fsm: FSMComponents,
};

/**
 * The `Customisations` component is a higher-order component (HOC) that allows for dynamic customization of child components based on settings.
 * It imports a set of components from the sub folders (.i.e "palau") inside Customisations module and stores them in the `ComponentList` object.
 *
 * Inside the component, it retrieves the version of the component specified in the customizations settings.
 * The version is used as a key to access the corresponding component from the `ComponentList` object.
 *
 * Finally, if a matching component is found, it renders the component with the props from the `children` component.
 *
 * IMPORTANT:
 * - Your customized version in settings have to matched the key of the `ComponentList` object (.i.e "palau").
 * - Your customized component's name have to matched the default component's name,
 * and the component's name in settings have to matched both of them (.i.e SampleButton)
 *
 * @param {ReactNode} children - The child component to be customized.
 * @returns {ReactNode} - The customized child component.
 * @example
 * Assume we have this setting:
 * {
 *   customisations: {
 *     componentVersions: {
 *       SampleButton: "palau"
 *     },
 *   },
 * }
 * Your code will look like:
 *
 * import { SampleButton } from './components/SampleButton';
 *
 * return <Customisations><SampleButton onClick={() => null} /></Customisations>
 *
 * => It will check if we have customized the SampleButton component or not ("palau" version is used in this case)
 * then it will replaced the default SampleButton component with the "palau" SampleButton component
 */
export const Customisations = ({ children }) => {
  const { getSetting } = useSettings();
  const settings = getSetting(SETTING_KEYS.CUSTOMISATIONS_COMPONENTS);

  // Because the component can be wrapped in another HOC, we might need to inject
  // the component name via the componentName property
  const componentName = children?.type?.componentName || children?.type?.name;
  const props = children?.props;

  if (!settings) {
    return children;
  }

  const componentVersion = settings[componentName];
  const Component = ComponentList[componentVersion]?.[componentName];

  if (!Component) return children;
  return <Component {...props} data-testid="component-84o8" />;
};
