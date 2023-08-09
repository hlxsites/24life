export default function decorate(block) {
  [...block.children].forEach((child) => {
    child.classList.add('slide');
  });

  const nextButton = document.createElement('button');
  nextButton.classList.add('next');
  nextButton.textContent = 'Next';
  const prevButton = document.createElement('button');
  prevButton.classList.add('prev');
  prevButton.textContent = 'Prev';

  let position = 0;
  // block.style.transform = 'translateX(0)';
  const slideCount = block.querySelectorAll('.slide').length;

  function moveSlides(diff) {
    position = (slideCount + position + diff) % slideCount;
    block.style.setProperty('--position', position);
  }
  nextButton.addEventListener('click', () => moveSlides(+1));
  prevButton.addEventListener('click', () => moveSlides(-1));
  moveSlides(0);
  block.append(prevButton, nextButton);
}
