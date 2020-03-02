import React from 'react';
import { PatientSectionList } from './index';
import { groupEntriesByLetter } from '../../helpers/list';
import { StyledView } from '../../styled/common';

export const data = [
  {
    id: 9,
    name: 'Adey Keasey',
    city: 'Mafra',
    lastVisit: new Date('7/25/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 60,
    name: 'Albert Hundell',
    city: 'Dagushan',
    lastVisit: new Date('9/13/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 1,
    name: 'Aldus Grewe',
    city: 'Ashmūn',
    lastVisit: new Date('5/2/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 97,
    name: 'Amandy Small',
    city: 'Warri',
    lastVisit: new Date('2/4/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 37,
    name: 'Annabel Acom',
    city: 'Haapajärvi',
    lastVisit: new Date('6/9/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 27,
    name: 'Annis Sproul',
    city: 'Veinticinco de Mayo',
    lastVisit: new Date('7/29/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 10,
    name: 'Ari Hardison',
    city: 'El Porvenir',
    lastVisit: new Date('11/18/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 19,
    name: 'Arnold Bicheno',
    city: 'Biga',
    lastVisit: new Date('4/28/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 63,
    name: 'Artemus Cokly',
    city: 'Houxiang',
    lastVisit: new Date('9/14/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 78,
    name: 'Ashleigh Jacketts',
    city: 'Zhuping',
    lastVisit: new Date('6/3/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 89,
    name: 'Atlante Rubinfajn',
    city: 'Liuji',
    lastVisit: new Date('5/12/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 8,
    name: 'Audy Keeler',
    city: 'Xinjia',
    lastVisit: new Date('11/20/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 70,
    name: 'Brenden Antliff',
    city: 'Nacaome',
    lastVisit: new Date('2/9/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 4,
    name: 'Buckie Hamelyn',
    city: 'Lin’an',
    lastVisit: new Date('3/4/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 28,
    name: 'Burlie Dunlea',
    city: 'Jiangshan',
    lastVisit: new Date('3/18/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 32,
    name: 'Burty Ayris',
    city: 'Chapimarca',
    lastVisit: new Date('4/15/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 36,
    name: 'Byron Rosas',
    city: 'Kebonagung',
    lastVisit: new Date('4/21/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 6,
    name: 'Carey Victor',
    city: 'Verkhov’ye',
    lastVisit: new Date('11/12/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 71,
    name: 'Carlota Taillard',
    city: 'Kinkala',
    lastVisit: new Date('8/2/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 14,
    name: 'Ced Probert',
    city: 'Qinshan',
    lastVisit: new Date('4/27/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 18,
    name: 'Christan Howard',
    city: 'Langgapayung',
    lastVisit: new Date('6/20/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 55,
    name: 'Chrotoem Wolfenden',
    city: 'Guanay',
    lastVisit: new Date('5/4/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 53,
    name: 'Colline Cuff',
    city: 'Dikou',
    lastVisit: new Date('7/27/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 38,
    name: 'Conant Alliker',
    city: 'Hongshunli',
    lastVisit: new Date('6/3/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 77,
    name: 'Cosimo Marchenko',
    city: 'Al Bilād',
    lastVisit: new Date('10/1/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 58,
    name: 'Darill Pendlebury',
    city: 'Gonghe',
    lastVisit: new Date('12/26/2018'),
    gender: 'male',
    age: '25',
  },
  {
    id: 74,
    name: 'Deanna Behninck',
    city: 'Ngulakan',
    lastVisit: new Date('8/29/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 40,
    name: 'Desirae Burchell',
    city: 'Sohbatpur',
    lastVisit: new Date('5/6/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 31,
    name: 'Desiree Teeney',
    city: 'Varberg',
    lastVisit: new Date('6/8/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 48,
    name: 'Diannne Bootell',
    city: 'Fonte Boa dos Nabos',
    lastVisit: new Date('3/11/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 81,
    name: 'Donielle Ugo',
    city: 'Phùng',
    lastVisit: new Date('4/3/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 5,
    name: 'Dorian Ojeda',
    city: 'Melaka',
    lastVisit: new Date('6/22/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 26,
    name: 'Elfie Lilian',
    city: 'Hujia',
    lastVisit: new Date('7/9/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 91,
    name: 'Emmerich Cejka',
    city: 'Tékane',
    lastVisit: new Date('5/13/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 34,
    name: 'Ernaline Kornacki',
    city: 'Sykiés',
    lastVisit: new Date('9/30/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 21,
    name: 'Ethelred Spacie',
    city: 'Shilin',
    lastVisit: new Date('6/4/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 65,
    name: 'Evania Gane',
    city: 'Vimieiro',
    lastVisit: new Date('7/8/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 49,
    name: 'Evey Conring',
    city: 'Pokrovka',
    lastVisit: new Date('9/6/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 90,
    name: 'Farrah Elies',
    city: 'Yingchuan',
    lastVisit: new Date('8/11/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 86,
    name: 'Fayre Benning',
    city: 'Cuijiamatou',
    lastVisit: new Date('5/26/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 15,
    name: 'Flinn Sayce',
    city: 'Le Mans',
    lastVisit: new Date('11/18/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 93,
    name: 'Fowler Carp',
    city: 'Biguaçu',
    lastVisit: new Date('1/5/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 75,
    name: 'Frasco Fransemai',
    city: 'Bairan',
    lastVisit: new Date('5/25/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 100,
    name: 'Freddie Dreossi',
    city: 'Kebunan',
    lastVisit: new Date('6/8/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 39,
    name: 'Gilli Pepye',
    city: 'Majāz al Bāb',
    lastVisit: new Date('12/3/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 45,
    name: 'Glenn Matteau',
    city: 'Boden',
    lastVisit: new Date('9/10/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 29,
    name: 'Granthem Broggetti',
    city: 'Cikaduen',
    lastVisit: new Date('7/15/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 22,
    name: 'Gregorio Hargess',
    city: 'Santa Cruz das Palmeiras',
    lastVisit: new Date('6/2/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 76,
    name: 'Gretel Blainey',
    city: 'Volgodonsk',
    lastVisit: new Date('9/8/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 52,
    name: 'Gwendolin Doughartie',
    city: 'Iba',
    lastVisit: new Date('3/10/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 82,
    name: 'Heriberto Fosken',
    city: 'Police nad Metují',
    lastVisit: new Date('9/23/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 20,
    name: 'Humfrey Seiler',
    city: 'Xiaochuan',
    lastVisit: new Date('10/26/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 84,
    name: 'Idelle Scase',
    city: 'Guanta',
    lastVisit: new Date('3/3/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 50,
    name: 'Inness Holtham',
    city: 'Arnprior',
    lastVisit: new Date('5/4/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 3,
    name: 'Isabelle Priestland',
    city: 'Calheta de Nesquim',
    lastVisit: new Date('3/24/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 79,
    name: 'Issiah Jeacock',
    city: 'El Suyatal',
    lastVisit: new Date('11/10/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 41,
    name: 'Jarrett Willeson',
    city: 'Palmar de Varela',
    lastVisit: new Date('10/3/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 33,
    name: 'Jemimah Poplee',
    city: 'Talisay',
    lastVisit: new Date('8/1/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 12,
    name: 'Jeralee Hugland',
    city: 'Carmen',
    lastVisit: new Date('1/28/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 30,
    name: 'Jillayne Humbee',
    city: 'Ciudian',
    lastVisit: new Date('2/22/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 23,
    name: 'Jillene Hartin',
    city: 'A’ershan',
    lastVisit: new Date('11/25/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 57,
    name: 'Katti Wessing',
    city: 'Sukorejo',
    lastVisit: new Date('1/3/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 59,
    name: 'Kipp Cosham',
    city: 'Oslo',
    lastVisit: new Date('1/24/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 16,
    name: 'Kirbee Levicount',
    city: 'Omaha',
    lastVisit: new Date('3/11/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 25,
    name: 'Krishnah Spridgeon',
    city: 'Kakegawa',
    lastVisit: new Date('9/25/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 62,
    name: 'Lek Forty',
    city: 'Sukosari',
    lastVisit: new Date('11/16/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 96,
    name: 'Leonora Beaby',
    city: 'Poroshkovo',
    lastVisit: new Date('5/14/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 88,
    name: 'Levi Bottini',
    city: 'Devesa',
    lastVisit: new Date('11/8/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 85,
    name: 'Lilias Wrist',
    city: 'R S',
    lastVisit: new Date('7/31/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 7,
    name: 'Lin Butchard',
    city: 'Sacramento',
    lastVisit: new Date('11/23/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 2,
    name: 'Lorilyn McKeefry',
    city: 'Daqiao',
    lastVisit: new Date('4/2/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 83,
    name: 'Lucy Marklew',
    city: 'Laocheng',
    lastVisit: new Date('12/25/2018'),
    gender: 'female',
    age: '25',
  },
  {
    id: 69,
    name: 'Lura Kibbye',
    city: 'Gotse Delchev',
    lastVisit: new Date('11/26/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 98,
    name: 'Maddy Barff',
    city: 'Canga’an',
    lastVisit: new Date('5/23/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 64,
    name: 'Margery Dumbelton',
    city: 'Arraga',
    lastVisit: new Date('12/24/2018'),
    gender: 'female',
    age: '25',
  },
  {
    id: 35,
    name: 'Marley Staddart',
    city: 'Bagahanlad',
    lastVisit: new Date('12/31/2018'),
    gender: 'female',
    age: '25',
  },
  {
    id: 24,
    name: 'Maxim Webber',
    city: 'Fermelã',
    lastVisit: new Date('9/8/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 42,
    name: 'Melodee Carcas',
    city: 'Willemstad',
    lastVisit: new Date('4/20/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 66,
    name: 'Micky Bowfin',
    city: 'La Clotilde',
    lastVisit: new Date('6/6/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 95,
    name: 'Nancy Venny',
    city: 'Qalyūb',
    lastVisit: new Date('5/17/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 68,
    name: 'Pattin Belle',
    city: 'Laylay',
    lastVisit: new Date('12/5/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 72,
    name: 'Quillan Ivanusyev',
    city: 'Porto Ferreira',
    lastVisit: new Date('12/28/2018'),
    gender: 'male',
    age: '25',
  },
  {
    id: 87,
    name: 'Raphaela Keggin',
    city: 'Pacaycasa',
    lastVisit: new Date('9/1/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 17,
    name: 'Rasla Gusticke',
    city: 'Banjar Pande',
    lastVisit: new Date('12/25/2018'),
    gender: 'female',
    age: '25',
  },
  {
    id: 11,
    name: 'Rayna Allchin',
    city: 'Taznakht',
    lastVisit: new Date('5/7/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 67,
    name: 'Reggi Petran',
    city: 'Ḩalāwah',
    lastVisit: new Date('4/14/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 80,
    name: 'Renard Brun',
    city: 'Kemlya',
    lastVisit: new Date('11/29/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 92,
    name: 'Rodolfo Pallant',
    city: 'Sofo-Birnin-Gwari',
    lastVisit: new Date('11/23/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 51,
    name: 'Rolland Kilsby',
    city: 'San Marcos',
    lastVisit: new Date('9/8/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 43,
    name: 'Roman Palser',
    city: 'Tongtuan',
    lastVisit: new Date('10/20/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 56,
    name: 'Roslyn Adlem',
    city: 'Đắk Glei',
    lastVisit: new Date('2/16/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 13,
    name: 'Roxana Blancowe',
    city: 'Chelles',
    lastVisit: new Date('8/12/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 61,
    name: 'Rudyard Neylan',
    city: 'Linchen',
    lastVisit: new Date('1/24/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 94,
    name: 'Silvanus MacDunleavy',
    city: 'Cái Dầu',
    lastVisit: new Date('2/9/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 73,
    name: 'Taddeusz MacCallister',
    city: 'Weizhou',
    lastVisit: new Date('2/2/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 44,
    name: 'Tasia Nolda',
    city: 'Wola Rębkowska',
    lastVisit: new Date('11/9/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 46,
    name: 'Tierney Dooher',
    city: 'Baruchowo',
    lastVisit: new Date('5/6/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 47,
    name: 'Tish Yglesia',
    city: 'Azilal',
    lastVisit: new Date('4/5/2019'),
    gender: 'female',
    age: '25',
  },
  {
    id: 99,
    name: 'Tommy Hollyer',
    city: 'Bến Tre',
    lastVisit: new Date('12/10/2019'),
    gender: 'male',
    age: '25',
  },
  {
    id: 54,
    name: 'Willy Edmundson',
    city: 'Zhenwen',
    lastVisit: new Date('8/21/2019'),
    gender: 'female',
    age: '25',
  },
];

const sortedData = groupEntriesByLetter(data);

export function BaseStory(): JSX.Element {
  return (
    <StyledView flex={1} width="100%">
      <StyledView height="20%" width="100%" />
      <PatientSectionList
        onPressItem={(patient):void => console.log(patient)}
        data={sortedData}
      />
    </StyledView>
  );
}
