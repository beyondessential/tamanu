import { AppIntroComponent } from './index';
import { Intro } from './Intro';
import { AppIntro1, AppIntro2, AppIntro3 } from '../Icons';

export const WelcomeIntro = AppIntroComponent({
  Visits: {
    screen: Intro,
    params: {
      Icon: AppIntro1,
      user: {
        name: 'John',
      },
      title: 'Search for patients',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
    },
  },
  Vitals: {
    screen: Intro,
    params: {
      Icon: AppIntro2,
      user: {
        name: 'John',
      },
      title: 'Record patient visits',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
    },
  },
  Vaccines: {
    screen: Intro,
    params: {
      Icon: AppIntro3,
      user: {
        name: 'John',
      },
      title: 'Sync data to the central system',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
      routeOutside: '',
    },
  },
});
