import {toClassName} from '../../scripts/lib-franklin.js';

/**
 * parameters: any of 'focus','fitness', 'fuel', 'recover', or 'large'
 * content structure: in first cell:
 *  - image
 *  - CATEGORY (optional)
 *  - title as linked h1, h2, h3, h4, h5, or h6
 *  - author with link
 */
export default function decorate(block) {
  let firstCell = block.firstElementChild.firstElementChild;
  firstCell.querySelector('h1, h2, h3, h4, h5, h6').classList.add('card-title');

  // link the image
  const pictureParagraph = firstCell.querySelector('picture').parentElement;
  const link = document.createElement('a');
  link.href = block.querySelector('.card-title a').href;
  link.append(...pictureParagraph.childNodes);
  link.classList.add('card-image');
  pictureParagraph.replaceWith(link);

  firstCell.lastElementChild.classList.add('card-author');

  // often there is a category like SUCCESS STORIES or GET STARTED.
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
