import 'dotenv/config';

const facilityFrontend = process.env.FACILITY_FRONTEND_URL;
const adminFrontend = process.env.ADMIN_FRONTEND_URL;

export const goToFacilityFrontend = async (page: any) => {
  await page.goto(facilityFrontend);
};

export const goToAdminFrontend = async (page: any) => {
  await page.goto(adminFrontend);
}; 
