import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { PatientNavigation } from '../components/PatientNavigation';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { usePatientRouteMap } from '../utils/usePatientRouteMap';

const checkShowNavigation = (prevProps, nextProps) => prevProps.match === nextProps.match;

const NavigationWrapper = React.memo(({ children, match, routeMap }) => {
  const showNavigation = !match.isExact;
  return showNavigation ? (
    <>
      <TwoColumnDisplay>
        <PatientInfoPane />
        <div style={{ overflow: 'hidden' }}>
          <PatientNavigation routeMap={routeMap} />
          {children}
        </div>
      </TwoColumnDisplay>
    </>
  ) : (
    children
  );
}, checkShowNavigation);

export const PatientRoutes = ({ match }) => {
  const routeMap = usePatientRouteMap();
  return (
    <NavigationWrapper routeMap={routeMap} match={match}>
      <Switch>
        {routeMap.map(route => (
          <RouteWithSubRoutes key={`route-${route.path}`} {...route} />
        ))}
      </Switch>
    </NavigationWrapper>
  );
}

const RouteWithSubRoutes = ({ path, component, routes }) => (
  <>
    <Route exact path={path} component={component} />
    {routes?.map(subRoute => (
      <RouteWithSubRoutes key={`route-${subRoute.path}`} {...subRoute} />
    ))}
  </>
);
