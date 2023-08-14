import { createOptimizedPicture, decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const backgroundImages = document.createElement('div');
  backgroundImages.classList.add('background-images');
  config.images.forEach((url) => {
    const p = document.createElement('p');
    p.classList.add('slide');
    p.append(createOptimizedPicture(url, config.title));
    backgroundImages.append(p);
  });
  block.append(backgroundImages);

  const overlay = document.createElement('div');
  overlay.classList.add('text-overlay');
  const h1 = document.createElement('h1');
  h1.append(config.title);
  overlay.append(h1);
  block.append(overlay);

  await decorateIcons(block);
}
