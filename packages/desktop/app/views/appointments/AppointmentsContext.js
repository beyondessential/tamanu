import React from 'react';

export const AppointmentsContext = React.createContext({});

export const AppointmentsContextProvider = props => {
  const [locations, setLocations] = React.useState([]);
  const [filteredLocations, setFilteredLocations] = React.useState({});
  const [isAllLocations, setIsAllLocations] = React.useState(true);
  const [appointments, setAppointments] = React.useState([]);

  React.useEffect(() => {
    // TODO: replace test data
    setLocations([
      {
        id: 'location-1',
        code: 'ACUTEAREA',
        name: 'Acute Area',
        markedForPush: true,
        createdAt: '2021-05-03T23:21:46.167Z',
        updatedAt: '2021-05-03T23:21:46.167Z',
        facilityId: 'ref/facility/ba',
      },
      {
        id: 'location-2',
        code: 'SHORTSTAY',
        name: 'Short-Stay',
        markedForPush: true,
        createdAt: '2021-05-03T23:29:43.070Z',
        updatedAt: '2021-05-03T23:29:43.070Z',
        facilityId: 'ref/facility/ba',
      },
      {
        id: 'location-3',
        code: 'DIABETESCLINIC',
        name: 'Diabetes Clinic',
        markedForPush: true,
        createdAt: '2021-05-03T23:35:20.994Z',
        updatedAt: '2021-05-03T23:35:20.994Z',
        facilityId: 'ref/facility/ba',
      },
    ]);
    setFilteredLocations({
      'location-1': true,
      'location-2': true,
      'location-3': true,
    });

    setAppointments([
      {
        id: '1',
        locationId: 'location-1',
        startTime: '2021-05-01T09:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '2',
        locationId: 'location-1',
        startTime: '2021-05-01T09:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '3',
        locationId: 'location-2',
        startTime: '2021-05-01T11:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '4',
        locationId: 'location-3',
        startTime: '2021-05-01T08:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '5',
        locationId: 'location-3',
        startTime: '2021-05-01T08:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Long User Name',
        }
      },
      {
        id: '6',
        locationId: 'location-3',
        startTime: '2021-05-01T08:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '7',
        locationId: 'location-3',
        startTime: '2021-05-01T08:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '8',
        locationId: 'location-2',
        startTime: '2021-05-01T12:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Long User Name',
        }
      },
      {
        id: '9',
        locationId: 'location-2',
        startTime: '2021-05-01T12:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
      {
        id: '10',
        locationId: 'location-2',
        startTime: '2021-05-01T12:00:00.000',
        durationInMinutes: 30,
        userId: 'user-1',
        user: {
          id: 'user-1',
          displayName: 'Test User',
        }
      },
    ]);
  }, []);

  function onAllLocationsChange(params) {
    if (isAllLocations) {
      setIsAllLocations(false);
      setFilteredLocations({});
    } else {
      setIsAllLocations(true);
      setFilteredLocations(
        locations.reduce((acc, location) => {
          return {
            ...acc,
            [location.id]: true,
          };
        }, {}),
      );
    }
  }

  function onLocationChange(location) {
    setFilteredLocations({ ...filteredLocations, [location]: !filteredLocations[location] });
  }
  return (
    <AppointmentsContext.Provider
      value={{
        locations,
        filteredLocations,
        isAllLocations,
        onAllLocationsChange,
        onLocationChange,
        appointments,
      }}
    >
      {props.children}
    </AppointmentsContext.Provider>
  );
};
