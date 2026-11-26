import { isRouteDescriptor } from '@tamanu/api-client';

// Validates a prop holding an API endpoint in either form a TamanuApi verb takes:
// a plain path string, or a route() descriptor carrying its template and params.
// PropTypes.object would pass any object, so a malformed endpoint would surface
// only as a broken URL at fetch time.
const validateEndpoint =
  isRequired =>
  (props, propName, componentName = 'a component') => {
    const value = props[propName];

    if (value === undefined || value === null) {
      return isRequired
        ? new Error(`The prop \`${propName}\` is marked as required in \`${componentName}\`.`)
        : null;
    }

    if (typeof value === 'string' || isRouteDescriptor(value)) return null;

    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`: expected a path string or a route() descriptor from @tamanu/api-client.`,
    );
  };

export const endpointPropType = Object.assign(validateEndpoint(false), {
  isRequired: validateEndpoint(true),
});
