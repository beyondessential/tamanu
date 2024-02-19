/* global NODE_ENV */

export const IS_DEVELOPMENT = NODE_ENV === 'development';

export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME;
