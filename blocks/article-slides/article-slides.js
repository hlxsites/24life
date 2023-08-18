import { createOptimizedPicture, readBlockConfig } from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';

/**
 * Slideshow with recent articles. Supports swiping on touch screens.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';
  const { goToSlide } = setupSlideControls(block);

  const slideshowButtons = document.createElement('div');
  slideshowButtons.classList.add('slideshow-buttons');

  const articles = await fetchArticles(config);
  articles.forEach((article, index) => {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    slide.innerHTML = `
      <div class="image">${createOptimizedPicture(article.image, article.title, index === 0).outerHTML}</div>
      <div class="text">
          <p class="subtitle">${plainText(article.section)}</p>
          <p class="title">${plainText(article.title)}</p>
          <p class="author">BY ${plainText(article.author)}</p>
      </div> `;
    block.append(slide);

    const button = document.createElement('button');
    button.ariaLabel = `go to slide ${article.title}`;
    button.addEventListener('click', () => goToSlide(index));
    slideshowButtons.append(button);

    if (index === 0) {
      slide.classList.add('active');
      button.classList.add('active');
    }
  });

  block.append(slideshowButtons);
}

async function fetchArticles(config) {
  return ffetch('/articles.json')
    .chunks(Number(config.limit || 9))
    .limit(Number(config.limit || 9))
    .all();
}

function setupSlideControls(block) {
  function goToSlide(index) {
    block.querySelector('.slide.active').classList.remove('active');
    [...block.querySelectorAll('.slide')].at(index).classList.add('active');

    block.querySelector('.slideshow-buttons .active')?.classList.remove('active');
    [...block.querySelectorAll('.slideshow-buttons button')].at(index).classList.add('active');

    // automatically advance slides. Reset timer when user interacts with the slideshow
    autoplaySlides();
  }

  let autoSlideInterval = null;
  function autoplaySlides() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => goToNextSlide(), 6000);
  }

  function goToNextSlide() {
    const activeSlide = block.querySelector('.slide.active');
    const nextSlide = activeSlide.nextElementSibling || block.querySelector('.slide');
    goToSlide([...block.querySelectorAll('.slide')].indexOf(nextSlide));
  }

  function goToPrevSlide() {
    const activeSlide = block.querySelector('.slide.active');
    const prevSlide = activeSlide.previousElementSibling || block.querySelector('.slide:last-child');
    goToSlide([...block.querySelectorAll('.slide')].indexOf(prevSlide));
  }

  /** detect swipe gestures on touch screens to advance slides */
  function gestureStart(event) {
    const touchStartX = event.changedTouches[0].screenX;

    function gestureEnd(endEvent) {
      const touchEndX = endEvent.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;
      if (delta < -5) {
        goToNextSlide();
      } else if (delta > 5) {
        goToPrevSlide();
      } else {
        // finger not moved enough, do nothing
      }
    }

    block.addEventListener('touchend', gestureEnd, { once: true });
  }

  block.addEventListener('touchstart', gestureStart, false);

  autoplaySlides();
  return { goToSlide };
}

/**
 * make text safe to use in innerHTML
 * @param text any string
 * @return {string} sanitized html string
 */
function plainText(text) {
  const fragment = document.createElement('div');
  fragment.append(text);
  return fragment.innerHTML;
}
