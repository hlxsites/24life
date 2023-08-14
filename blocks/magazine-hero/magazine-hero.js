import { createOptimizedPicture, decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

function createArticleLink(url, text) {
  const link = document.createElement('a');
  link.classList.add('article-link');
  link.href = url;
  link.textContent = text;
  return link;
}

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  // readBlockConfig does not keep the link texts, so we store them here
  const linkTexts = {};
  for (const a of [...block.querySelectorAll('a')]) {
    linkTexts[a.href] = a.textContent;
  }
  block.textContent = '';

  const overlay = document.createElement('div');
  overlay.classList.add('text-overlay');

  const leftSide = document.createElement('div');
  leftSide.classList.add('left-side');
  overlay.append(leftSide);

  const issue = document.createElement('p');
  issue.classList.add('issue');
  issue.append(config.issue);
  leftSide.append(issue);

  const h1 = document.createElement('h1');
  h1.append(config.title);
  leftSide.append(h1);

  const description = document.createElement('p');
  description.classList.add('description');
  description.append(config.description);
  leftSide.append(description);

  const rightSide = document.createElement('div');
  rightSide.classList.add('right-side');
  overlay.append(rightSide);

  rightSide.append(createArticleLink(config.focus, linkTexts[config.focus]));
  rightSide.append(createArticleLink(config.fitness, linkTexts[config.fitness]));
  rightSide.append(createArticleLink(config.fuel, linkTexts[config.fuel]));
  rightSide.append(createArticleLink(config.recover, linkTexts[config.recover]));

  const downButton = document.createElement('button');
  downButton.classList.add('down-button');
  downButton.textContent = 'Explore This Issue';
  downButton.href = '#'; // TODO: link to first content after video
  rightSide.append(downButton);

  block.append(overlay);

  createBackgroundSlideshow(block, config.images);

  await decorateIcons(block);
}

function createBackgroundSlideshow(block, images) {
  const backgroundImages = document.createElement('div');
  backgroundImages.classList.add('background-images');

  const slideshowButtons = document.createElement('div');
  slideshowButtons.classList.add('slideshow-buttons');

  function goToSlide(index) {
    block.querySelector('.slide.active').classList.remove('active');
    [...block.querySelectorAll('.slide')].at(index).classList.add('active');

    block.querySelector('.slideshow-buttons .active').classList.remove('active');
    [...block.querySelectorAll('.slideshow-buttons button')].at(index).classList.add('active');
  }

  images.forEach((url, index) => {
    const button = document.createElement('button');
    button.ariaLabel = `go to Slide ${index + 1}`;
    slideshowButtons.append(button);
    button.addEventListener('click', () => goToSlide(index));

    const p = document.createElement('p');
    p.classList.add('slide');
    p.append(createOptimizedPicture(url));
    backgroundImages.append(p);

    if (index === 0) {
      p.classList.add('active');
      button.classList.add('active');
    }
  });
  block.append(backgroundImages);
  block.append(slideshowButtons);
}
