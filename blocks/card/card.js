import {createOptimizedPicture, toClassName} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  let firstCell = block.firstElementChild.firstElementChild;
  firstCell.querySelector('picture').parentElement.classList.add('card-image');
  firstCell.querySelector('h1, h2, h3, h4, h5, h6').classList.add('card-title');
  firstCell.lastElementChild.classList.add('card-author');

  // often there is a category like SUCCESS STORIES or GET STARTED.
  // get first p without any class
  let category = firstCell.querySelector('p:not([class])');
  if(category){
    const link = document.createElement('a');
    link.href = `/collections/${toClassName(category.textContent)}`;
    link.classList.add('card-category');
    link.append(...category.childNodes);
    category.replaceWith(link);
  }

  const accentColor = ['focus','fitness', 'fuel', 'recover']
    .find(category => block.classList.contains(category));
  block.style.setProperty('--accent-color', `var(--color-${accentColor})`);

}
