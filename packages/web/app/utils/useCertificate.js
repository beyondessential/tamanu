import { useSelector } from 'react-redux';
import { ASSET_NAMES } from '@tamanu/constants';
import { useLocalisation } from '../contexts/Localisation';
import { useAsset } from './useAsset';
import { useTemplate } from './useTemplate';
import { getCurrentUser } from '../store';

export const useCertificate = ({ footerAssetName } = {}) => {
  const { getLocalisation } = useLocalisation();
  const { data: logo, isFetching: isLogoFetching } = useAsset(ASSET_NAMES.LETTERHEAD_LOGO);
  const { data: watermark, isFetching: isWatermarkFetching } = useAsset(
    ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK,
  );
  const { data: footerImg, isFetching: isFooterImgFetching } = useAsset(
    footerAssetName || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const { data: deathCertFooterImg, isFetching: isDeathCertFooterImgFetching } = useAsset(
    ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const { data: letterhead, isFetching: isLetterheadFetching } = useTemplate(
    'templates.letterhead',
  );
  const title = letterhead?.data?.title || getLocalisation('templates.letterhead.title');
  const subTitle = letterhead?.data?.subTitle || getLocalisation('templates.letterhead.subTitle');

  const isFetching =
    isLogoFetching ||
    isWatermarkFetching ||
    isFooterImgFetching ||
    isLetterheadFetching ||
    isDeathCertFooterImgFetching;

  const currentUser = useSelector(getCurrentUser);

  const data = {
    title,
    subTitle,
    logo,
    watermark,
    footerImg,
    deathCertFooterImg,
    printedBy: currentUser?.displayName,
  };

  return {
    data
    isFetching,
  };
};
