import { createOptimizedPicture, decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

function goToNextSlide(block) {
  const current = block.querySelector('.slide.active');
  current.classList.remove('active');
  let { nextElementSibling } = current;
  if (!nextElementSibling) {
    nextElementSibling = block.querySelector('.slide');
  }
  nextElementSibling.classList.add('active');
}

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const overlay = document.createElement('div');
  overlay.classList.add('text-overlay');
  const h1 = document.createElement('h1');
  h1.append(config.title);
  overlay.append(h1);
  block.append(overlay);

  const backgroundImages = document.createElement('div');
  backgroundImages.classList.add('background-images');
  config.images.forEach((url, index) => {
    const p = document.createElement('p');
    p.classList.add('slide');
    if (index === 0) {
      p.classList.add('active');
    }
    p.append(createOptimizedPicture(url, config.title));
    backgroundImages.append(p);
  });
  block.append(backgroundImages);

  block.addEventListener('click', () => {
    goToNextSlide(block);
  });

  await decorateIcons(block);
}
