import { useEffect } from 'react';
import { useSettings } from '../contexts/Settings';
import { registerFonts } from '@tamanu/shared/utils/pdf/registerFonts';

export function RegisterFontsIfEnabled() {
  const { getSetting } = useSettings();
  const enablePdfFonts = getSetting('features.globalPdfFont');

  useEffect(() => {
    if (enablePdfFonts) {
      registerFonts();
    }
  }, [enablePdfFonts]);

  return null;
}
