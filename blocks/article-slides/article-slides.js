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
    const slide = document.createElement('a');
    slide.classList.add('slide');
    slide.href = article.path;

    const imageSizes = [
      // 600px and larger screens have an image that is 66% wide. So we can load a slightly smaller
      // image than the screen width. .This component is used on the homepage, so we optimize this a
      // little more than usually.
      { media: '(min-width: 1200px)', width: '2000' },
      { media: '(min-width: 900px)', width: '900' },
      { media: '(min-width: 600px)', width: '600' },
      // tablet and mobile sizes:
      { media: '(min-width: 400px)', width: '500' },
      { width: '400' },
    ];
    slide.innerHTML = `
      <div class="image">${createOptimizedPicture(article.image, article.title, index === 0, imageSizes).outerHTML}</div>
      <div class="text">
          <p class="subtitle">${plainText(article.section)}</p>
          <p class="title">${plainText(article.title)}</p>
          <p class="author">BY ${plainText(article.authors)}</p>
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
    autoSlideInterval = setInterval(() => advanceSlides(+1), 6000);
  }

  function advanceSlides(diff) {
    const allSlides = [...block.querySelectorAll('.slide')];
    const activeSlide = block.querySelector('.slide.active');
    const currentIndex = allSlides.indexOf(activeSlide);

    const newSlideIndex = (allSlides.length + currentIndex + diff) % allSlides.length;
    goToSlide(newSlideIndex);
  }

  /** detect swipe gestures on touch screens to advance slides */
  function gestureStart(event) {
    const touchStartX = event.changedTouches[0].screenX;

    function gestureEnd(endEvent) {
      const touchEndX = endEvent.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;
      if (delta < -5) {
        advanceSlides(+1);
      } else if (delta > 5) {
        advanceSlides(-1);
      } else {
        // finger not moved enough, do nothing
      }
    }

    block.addEventListener('touchend', gestureEnd, { once: true });
  }

  block.addEventListener('touchstart', gestureStart, { passive: true });

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
