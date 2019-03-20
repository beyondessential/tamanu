import { toUpper } from 'lodash';
import shortid from 'shortid';
import request from 'request-promise';
const apiURL = 'https://api.universalcodes.msupply.org.nz/v1/items';
const modelName = 'drug';

export default async (database) => {
  try {
    const drugs = await fetchDrugs();
    database.write(() => {
      drugs.forEach(drug => {
        const { code, name } = drug;
        const drugObject = database.findOne(modelName, name, 'name');
        if (!drugObject || drugObject.length <= 0) {
          database.create(modelName, {
            _id: shortid.generate(),
            name,
            code: toUpper(code)
          }, true);
        }
      });
    });
  } catch (error) {
    console.error(`Error happened while fetching drugs ${error}`);
  }
}

const fetchDrugs = async () => {
  const apiURL = 'https://api.universalcodes.msupply.org.nz/v1/items';
  const drugsResponse = await request(apiURL);
  const drugs = JSON.parse(drugsResponse);
  return drugs;
};