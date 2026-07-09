import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir = import.meta.dirname
  ? path.join(import.meta.dirname, '../../assets/fonts')
  : '/fonts';

export const registerFonts = () => {
  if (Font.getRegisteredFonts()['GlobalPdfFont']) return;
  Font.register({
    family: 'GlobalPdfFont',
    src: path.join(baseDir, 'NotoKufiArabic-Regular.ttf'),
  });

  Font.register({
    family: 'GlobalPdfFont-Bold',
    src: path.join(baseDir, 'NotoKufiArabic-Bold.ttf'),
  });
};
