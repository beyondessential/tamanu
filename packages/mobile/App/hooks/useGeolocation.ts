import { useEffect, useRef, useState } from 'react';
import Geolocation, {
  GeolocationError,
  GeolocationResponse,
} from '@react-native-community/geolocation';
import { GEOLOCATION_OPTIONS } from '~/constants/comms';

interface Props {
  watch?: boolean;
}

export const useGeolocation = ({ watch }: Props) => {
  const [coords, setCoords] = useState<GeolocationResponse['coords'] | null>(null);
  const [error, setError] = useState<GeolocationError>();
  const [isWatching, setIsWatching] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchId.current) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const requestGeolocationPermission = () => {
    Geolocation.requestAuthorization(
      () => {
        setError(null);
        Geolocation.getCurrentPosition(
          position => setCoords(position.coords),
          error => setError(error),
          GEOLOCATION_OPTIONS,
        );

        if (!watch) return;
        watchId.current = Geolocation.watchPosition(
          position => setCoords(position.coords),
          error => setError(error),
          GEOLOCATION_OPTIONS,
        );
        setIsWatching(true);
      },
      error => setError(error),
    );
  };

  const cancelWatchGeolocation = () => {
    if (watchId.current) {
      Geolocation.clearWatch(watchId.current);
    }
    setIsWatching(false);
    setCoords(null);
    setError(null);
  };

  return { coords, error, isWatching, requestGeolocationPermission, cancelWatchGeolocation };
};
