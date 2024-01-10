import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';
import { instructions } from '@vite-pwa/assets-generator/api/instructions';
import { generateAssets } from '@vite-pwa/assets-generator/api/generate-assets';
import { generateHtmlMarkup } from '@vite-pwa/assets-generator/api/generate-html-markup';
import { generateManifestIconsEntry } from '@vite-pwa/assets-generator/api/generate-manifest-icons-entry';
import FS from 'fs';

const doThing = async () => {
  const idn = await instructions({
    image: 'public/pwa-icon-base.png',
    imageName: '/public/pwa-icon-base.png',
    imageResolver: () => FS.readFileSync('public/pwa-icon-base.png'),
    resolveSvgName: name => `icons/${name}`,
    preset,
    basePath: '/icons/',
    resolveSvgName: name => `$dog/${name}`,
    htmlLinks: {
      xhtml: false,
      includeId: false,
    },
    maskable: {},
  });

  await generateAssets(idn, true, 'public/icons');

  const html = await generateHtmlMarkup(idn);

  // // Create new index.html with the generated html, along with the existing index.html
  const existingIndex = FS.readFileSync('index.template.html', 'utf8');
  const newIndex = existingIndex.replace('<!-- pwa-template-entry -->', html.join('\n'));
  FS.writeFileSync('index.html', newIndex);

  const manifestIconEntries = await generateManifestIconsEntry('png', idn);

  const icons = manifestIconEntries.icons.map(icon => ({
    ...icon,
    src: `/icons/${icon.src}`,
  }));

  // write icons to manifest
  FS.writeFileSync(
    'public/manifest.json',
    JSON.stringify(
      {
        background_color: '#FFFFFF',
        description: 'Tamanu is a free and open-source EHR for low resource and remote settings.',
        display: 'standalone',
        name: 'Tamanu',
        scope: '/',
        short_name: 'Tamanu',
        start_url: '/',
        theme_color: '#326699',
        icons,
      },
      null,
      2,
    ),
  );
};

doThing();
