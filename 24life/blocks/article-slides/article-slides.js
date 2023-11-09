/**
 * Slideshow with recent articles. Supports swiping on touch screens.
 * Also supports manually adding content into the block.
 * @param block
 */
export default async function decorate(block) {
  const { goToSlide } = setupSlideControls(block);

  const slideshowButtons = document.createElement('div');
  slideshowButtons.classList.add('slideshow-buttons');

  [...block.children].forEach((row, index) => {
    const articleLink = row.querySelector('a');
    const articlePath = articleLink.href;
    const articleTitle = articleLink.textContent;
    const slide = document.createElement('a');
    slide.classList.add('slide');
    slide.href = articlePath;

    slide.append(...row.children);
    slide.firstChild.classList.add('image');

    const textElement = slide.lastChild;
    textElement.classList.add('text');
    textElement.children[0].classList.add('subtitle');

    textElement.children[1].innerHTML = articleLink.innerHTML;
    textElement.children[1].classList.add('title');
    textElement.children[2].classList.add('author');
    textElement.children[2].prepend('BY ');

    row.replaceWith(slide);

    const button = document.createElement('button');
    button.ariaLabel = `go to slide ${articleTitle}`;
    button.addEventListener('click', () => goToSlide(index));
    slideshowButtons.append(button);

    if (index === 0) {
      slide.classList.add('active');
      button.classList.add('active');
    }
  });

  block.append(slideshowButtons);
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
