import { createOptimizedPicture, decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  // readBlockConfig does not keep the link texts, so we store them here
  const linkTexts = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const a of block.querySelectorAll('a')) {
    linkTexts[a.href] = a.textContent;
  }
  block.textContent = '';

  const overlay = document.createElement('div');
  overlay.classList.add('text-overlay');
  overlay.append(createLeftOverlay(overlay, config));
  overlay.append(createRightOverlay(overlay, config, linkTexts));

  block.append(overlay);

  createBackgroundSlideshow(block, config.images);

  await decorateIcons(block);
}

function createArticleLink(config, sectionName, linkTexts) {
  const link = document.createElement('a');
  link.classList.add('article-link');
  link.href = config[sectionName];
  link.textContent = linkTexts[config[sectionName]];
  link.classList.add(`color-${sectionName}`);
  return link;
}

function createLeftOverlay(overlay, config) {
  const leftSide = document.createElement('div');
  leftSide.classList.add('left-side');

  const issue = document.createElement('p');
  issue.classList.add('issue', 'animate-slide-from-left');
  issue.append(config.issue);
  leftSide.append(issue);

  const h1 = document.createElement('h1');
  h1.classList.add('animate-appear-from-center');
  h1.append(config.title);
  leftSide.append(h1);

  const description = document.createElement('p');
  description.classList.add('description', 'animate-slide-from-left');
  description.append(config.description);
  leftSide.append(description);

  return leftSide;
}

function createRightOverlay(overlay, config, linkTexts) {
  const rightSide = document.createElement('div');
  rightSide.classList.add('right-side');

  rightSide.append(createArticleLink(config, 'focus', linkTexts));
  rightSide.append(createArticleLink(config, 'fitness', linkTexts));
  rightSide.append(createArticleLink(config, 'fuel', linkTexts));
  rightSide.append(createArticleLink(config, 'recover', linkTexts));

  const downButton = document.createElement('button');
  downButton.classList.add('down-button');
  downButton.innerHTML = 'Explore This Issue <span class="icon icon-arrow-down-solid"></span>';
  downButton.href = '#'; // TODO: link to first content after video
  rightSide.append(downButton);

  return rightSide;
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
