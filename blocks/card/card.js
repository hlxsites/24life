import {toClassName} from '../../scripts/lib-franklin.js';

/**
 * parameters: any of 'focus','fitness', 'fuel', 'recover', or 'large'
 * content structure: in first cell:
 *  - image
 *  - CATEGORY (optional)
 *  - title as linked h1, h2, h3, h4, h5, or h6
 *  - author with link (optional)
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

  if(firstCell.lastElementChild.classList.length === 0) {
    firstCell.lastElementChild.classList.add('card-author');
  }

  // often there is a category like SUCCESS STORIES or GET STARTED. Multiple categories
  // can be comma separated.
  let category = firstCell.querySelector('p:not([class])');
  if(category){
    category.classList.add('card-categories');
    const links = category.textContent.split(',')
      .map(categoryText => {
      const link = document.createElement('a');
      link.href = `/collections/${toClassName(categoryText.trim())}`;
      link.append(categoryText.trim());
      return link;
    });
    category.innerHTML = '';
    category.append(...links);
  }

  const accentColor = ['focus','fitness', 'fuel', 'recover']
    .find(category => block.classList.contains(category))
  if(accentColor){
    block.style.setProperty('--accent-color', `var(--color-${accentColor})`);
    block.style.setProperty('--category-text-color', `var(--color-${accentColor})`);
  } else {
    block.style.setProperty('--accent-color', `var(--color-default-card)`);
    block.style.setProperty('--category-text-color', `var(--color-default-card-text)`);
  }

  if(block.classList.contains('large')){
    // create separate column for large image
    block.closest('.card-wrapper').classList.add('large');
    block.closest('.card-container').classList.add('has-large-card');
  }

}
