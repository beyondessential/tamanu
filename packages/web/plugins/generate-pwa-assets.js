import { minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';
import { instructions } from '@vite-pwa/assets-generator/api/instructions';
import { generateAssets } from '@vite-pwa/assets-generator/api/generate-assets';
import { generateHtmlMarkup } from '@vite-pwa/assets-generator/api/generate-html-markup';
import { generateManifestIconsEntry } from '@vite-pwa/assets-generator/api/generate-manifest-icons-entry';
import { promises as fs } from 'fs';

const generatePWAAssets = async () => {
  console.log('Generating PWA assets...');
  const iai = await instructions({
    imageName: 'public/pwa-icon-base.png',
    imageResolver: () => fs.readFile('public/pwa-icon-base.png'),
    preset,
    basePath: '/icons/',
    htmlLinks: {
      xhtml: false,
      includeId: false,
    },
  });

  await generateAssets(iai, true, 'public/icons');
  console.log('PWA assets generated!');

  const html = await generateHtmlMarkup(iai);

  // // Create new index.html with the generated html, along with the existing index.html
  const existingIndex = await fs.readFile('index.template.html', 'utf8');
  const newIndex = existingIndex.replace('<!-- pwa-template-entry -->', html.join('\n'));
  await fs.writeFile('index.html', newIndex);
  console.log('PWA html markup generated!');

  const manifestIconEntries = await generateManifestIconsEntry('png', iai);

  const icons = manifestIconEntries.icons.map(icon => ({
    ...icon,
    src: `/icons/${icon.src}`,
  }));

  // Create new manifest with icons
  await fs.writeFile(
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
  console.log('PWA manifest generated! Done ✅');
};

export const generatePWAAssetsPlugin = command => ({
  name: 'generate-pwa-assets',
  async buildStart() {
    if (command !== 'build') return;
    await generatePWAAssets();
  },
});
