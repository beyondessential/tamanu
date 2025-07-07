import { useEffect } from 'react';
import { useSettings } from 'packages/web/app/contexts/Settings.jsx';
import { registerFonts } from './languageContext';

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
