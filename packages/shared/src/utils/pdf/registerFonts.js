import path from 'path';
import { Font } from '@react-pdf/renderer';

const baseDir =
  typeof __dirname !== 'undefined' ? path.join(__dirname, '../../assets/fonts') : '/fonts';

export const registerFonts = () => {
  if (Font.getRegisteredFonts()['NotoKufiArabic-Regular']) return;
  Font.register({
    family: 'NotoKufiArabic-Regular',
    src: path.join(baseDir, 'NotoKufiArabic-Regular.ttf'),
  });

  Font.register({
    family: 'NotoKufiArabic-Bold',
    src: path.join(baseDir, 'NotoKufiArabic-Bold.ttf'),
  });
};
