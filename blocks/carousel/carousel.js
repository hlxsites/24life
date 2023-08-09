export default function decorate(block) {
  const slideCount = block.childElementCount;
  [...block.children].forEach((child) => child.classList.add('slide'));

  // make a total of 3 copies of the slides, so it appears to be infinite scrolling
  block.append(...[...block.children].map((child) => child.cloneNode(true)));
  block.append(...[...block.children].map((child) => child.cloneNode(true)));

  function moveSlides(diff, smooth = 'smooth') {
    // once the scroll is finished, make sure we are in the middle section
    onScrollEnd(block, () => {
      stayInCenterSlides(slideCount, block);
    }, true);

    const position = getCurrentScrollIndex(block) + diff;
    block.scrollTo({ top: 0, left: position * block.clientWidth, behavior: smooth });
  }

  // set initial position
  requestAnimationFrame(() => {
    moveSlides(slideCount, 'instant');
  });

  onScrollEnd(block, () => {
    stayInCenterSlides(slideCount, block);
  }, false);

  block.parentElement.append(...createButtons(moveSlides));
}

function getCurrentScrollIndex(block) {
  return block.scrollLeft / block.clientWidth;
}

function stayInCenterSlides(slideCount, block) {
  // make sure we are in the middle section after each scroll
  let position = getCurrentScrollIndex(block);
  if (position < slideCount || position >= slideCount * 2) {
    position = slideCount + (position % slideCount);
    block.scrollTo({ top: 0, left: position * block.clientWidth, behavior: 'instant' });
  }
}

function createButtons(moveSlides) {
  const prevButton = document.createElement('button');
  prevButton.classList.add('prev');
  prevButton.textContent = 'Prev';
  prevButton.addEventListener('click', () => moveSlides(-1));

  const nextButton = document.createElement('button');
  nextButton.classList.add('next');
  nextButton.textContent = 'Next';
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
