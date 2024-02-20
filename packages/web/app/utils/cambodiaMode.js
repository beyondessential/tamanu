import { BRAND_IDS } from '@tamanu/constants';

const CAMBODIA_CONFIG = {
  id: BRAND_IDS.CAMBODIA,
  name: 'KhmEIR',
};

const TAMANU_CONFIG = {
  id: BRAND_IDS.TAMANU,
  name: 'Tamanu',
};

export const checkIsURLCambodia = (currentURL = window.location.hostname) => {
  const whitelist = ['khmer', 'cambodia', 'khmeir'];
  const regex = new RegExp(whitelist.join('|'), 'i');
  return regex.test(currentURL);
};

const getBrandConfig = () => (checkIsURLCambodia() ? CAMBODIA_CONFIG : TAMANU_CONFIG);

export const getBrandName = () => getBrandConfig().name;

export const getBrandId = () => getBrandConfig().id;
