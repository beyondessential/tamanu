import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
  if (Font.getRegisteredFonts()['GlobalPdfFont']) return;
  Font.register({
    family: 'GlobalPdfFont',
    src: path.join(baseDir, 'NotoKufiArabic-Regular.ttf'),
    fontWeight: 400,
  });

  Font.register({
    family: 'GlobalPdfFont',
    src: path.join(baseDir, 'NotoKufiArabic-Bold.ttf'),
    fontWeight: 700,
  });
};
