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
  const slideshowButtons = document.createElement('div');
  slideshowButtons.classList.add('slideshow-buttons');
  config.images.forEach((url, index) => {
    const button = document.createElement('button');
    button.ariaLabel = `go to Slide ${index + 1}`;
    slideshowButtons.append(button);

    const p = document.createElement('p');
    p.classList.add('slide');
    p.append(createOptimizedPicture(url, config.title));
    backgroundImages.append(p);

    if (index === 0) {
      p.classList.add('active');
      button.classList.add('active');
    }
  });
  block.append(backgroundImages);
  block.append(slideshowButtons);

  block.addEventListener('click', () => {
    goToNextSlide(block);
  });

  await decorateIcons(block);
}
