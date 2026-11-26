import path from 'path';
import { Font } from '@react-pdf/renderer';

import { GLOBAL_PDF_FONT, GLOBAL_PDF_FONT_BOLD } from './fonts';

const baseDir = import.meta.dirname
  ? path.join(import.meta.dirname, '../../assets/fonts')
  : '/fonts';

export const registerFonts = () => {
  if (Font.getRegisteredFonts()[GLOBAL_PDF_FONT]) return;
  Font.register({
    family: GLOBAL_PDF_FONT,
    src: path.join(baseDir, 'NotoKufiArabic-Regular.ttf'),
  });

  Font.register({
    family: GLOBAL_PDF_FONT_BOLD,
    src: path.join(baseDir, 'NotoKufiArabic-Bold.ttf'),
  });
};
