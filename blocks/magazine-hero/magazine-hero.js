import { createOptimizedPicture, decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

function goToSlide(block, index) {
  block.querySelector('.slide.active').classList.remove('active');
  [...block.querySelectorAll('.slide')].at(index).classList.add('active');

  block.querySelector('.slideshow-buttons .active').classList.remove('active');
  [...block.querySelectorAll('.slideshow-buttons button')].at(index).classList.add('active');
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
    button.addEventListener('click', () => {
      goToSlide(block, index);
    });

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

  await decorateIcons(block);
}
