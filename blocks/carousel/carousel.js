export default function decorate(block) {
  [...block.children].forEach((child) => {
    child.classList.add('slide');
  });

  let position = 0;
  const slideCount = block.querySelectorAll('.slide').length;

  function moveSlides(diff) {
    position = (slideCount + position + diff) % slideCount;
    block.style.setProperty('--position', position);
  }

  // add buttons
  const nextButton = document.createElement('button');
  nextButton.classList.add('next');
  nextButton.textContent = 'Next';
  const prevButton = document.createElement('button');
  prevButton.classList.add('prev');
  prevButton.textContent = 'Prev';
  nextButton.addEventListener('click', () => moveSlides(+1));
  prevButton.addEventListener('click', () => moveSlides(-1));
  block.append(prevButton, nextButton);
}
