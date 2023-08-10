import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  [...block.children].forEach((child, index) => {
    child.classList.add('slide');
    child.dataset.slideId = index;
  });

  // make a total of 3 copies of the slides, so it appears to be infinite scrolling
  const originalSlides = [...block.querySelectorAll('.slide')];
  block.prepend(...(cloneSlides(originalSlides)));
  block.append(...(cloneSlides(originalSlides)));

  function moveSlides(diff, smooth = 'smooth') {
    const target = diff > 0 ? findNextSlideOnTheRight(block) : findNextSlideOnTheLeft(block);
    block.scrollTo({ top: 0, left: target.offsetLeft, behavior: smooth });
  }

  // set initial position
  requestAnimationFrame(() => {
    scrollToSlide(originalSlides[0], block);
  });

  // once the scroll is finished, jump back to an original slide in the middle
  onScrollEnd(block, () => {
    const original = getOriginal(getCurrentSlide(block), block);
    if (original) {
      scrollToSlide(original, block);
    }
  }, false);

  block.append(...createButtons(moveSlides));
  await decorateIcons(block);
}

function findNextSlideOnTheRight(block) {
  const viewEnd = block.scrollLeft + block.clientWidth;
  return [...block.querySelectorAll('.slide')]
    .find((slide) => viewEnd < slide.offsetLeft);
}

function getCurrentSlide(block) {
  const viewStart = block.scrollLeft;
  const viewEnd = block.scrollLeft + block.clientWidth;
  return [...block.querySelectorAll('.slide')]
    .find((slide) => viewStart <= slide.offsetLeft && slide.offsetLeft < viewEnd);
}

function cloneSlides(allSlides) {
  return allSlides.map((child) => {
    const clone = child.cloneNode(true);
    clone.dataset.clone = true;
    clone.dataset.slideCloneId = child.dataset.slideId;
    delete clone.dataset.slideId;
    return clone;
  });
}

function findNextSlideOnTheLeft(block) {
  const viewStart = block.scrollLeft;
  const candidate = [...block.querySelectorAll('.slide')]
    .reverse()
    .find((slide) => slide.offsetLeft < viewStart - block.clientWidth);

  // try to scroll a full page
  if (candidate) return candidate;
  // if there not enough slides to scroll a full page, scroll to the beginning
  return block.querySelector('.slide');
}

function scrollToSlide(original, block, behavior = 'instant') {
  block.scrollTo({ top: 0, left: original.offsetLeft, behavior });
}

function getOriginal(slide, block) {
  if (slide.dataset.slideCloneId) {
    return block.querySelector(`[data-slide-id="${slide.dataset.slideCloneId}"]`);
  }
  return null;
}

function createButtons(moveSlides) {
  function icon(name) {
    const arrow = document.createElement('span');
    arrow.classList.add('icon', `icon-${name}`);
    return arrow;
  }

  const prevButton = document.createElement('button');
  prevButton.classList.add('prev');
  prevButton.ariaLabel = 'show previous slide';
  prevButton.append(icon('angle-left'));
  prevButton.addEventListener('click', () => moveSlides(-1));

  const nextButton = document.createElement('button');
  nextButton.classList.add('next');
  nextButton.ariaLabel = 'show next slide';
  nextButton.append(icon('angle-right'));
  nextButton.addEventListener('click', () => moveSlides(+1));

  return [prevButton, nextButton];
}

/** Fallback for Safari, see explanation on https://developer.chrome.com/blog/scrollend-a-new-javascript-event/
 and https://stackoverflow.com/a/4620986/79461 */
function onScrollEnd(block, callback, once = false) {
  if ('onscrollend' in window) {
    block.addEventListener('scrollend', callback, { once });
    return;
  }
  let timer = null;
  const scrollListener = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // no scrolling happened for 150ms
      if (once) block.removeEventListener('scroll', scrollListener);
      callback();
    }, 150);
  };
  block.addEventListener('scroll', scrollListener);
}
