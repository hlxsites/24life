import { createOptimizedPicture, toClassName } from '../../scripts/lib-franklin.js';

/**
 * parameters: any of 'focus','fitness', 'fuel', 'recover', or 'large'
 * content structure: in first cell:
 *  - image
 *  - CATEGORY (optional)
 *  - title as linked h1, h2, h3, h4, h5, or h6
 *  - author with link (optional)
 */
export default function decorate(block) {
  const firstCell = block.firstElementChild.firstElementChild;
  firstCell.querySelector('h1, h2, h3, h4, h5, h6').classList.add('card-title');

  // link the image
  const pictureParagraph = firstCell.querySelector('picture').parentElement;
  const link = document.createElement('a');
  link.href = block.querySelector('.card-title a').href;
  link.append(...pictureParagraph.childNodes);
  link.classList.add('card-image');
  pictureParagraph.replaceWith(link);

  // reduce image size: on desktop the images are smaller than on mobile.
  // Because on mobile they are full width and need to be larger.
  const image = link.querySelector('img');
  const imageSizes = [
    { media: '(min-width: 900px)', width: '650' },
    { media: '(min-width: 500px)', width: '500' },
    { media: '(min-width: 400px)', width: '400' },
    { width: '300' },
  ];
  image.closest('picture').replaceWith(
    createOptimizedPicture(image.src, image.alt, false, imageSizes),
  );

  if (firstCell.lastElementChild.classList.length === 0) {
    firstCell.lastElementChild.classList.add('card-author');
  }

  // often there is a category like SUCCESS STORIES or GET STARTED. Multiple categories
  // can be comma separated.
  const category = firstCell.querySelector('p:not([class])');
  if (category) {
    category.classList.add('card-categories');
    const links = category.textContent.split(',')
      .map((categoryText) => {
        const a = document.createElement('a');
        a.href = `/collections/${toClassName(categoryText.trim())}`;
        a.append(categoryText.trim());
        return a;
      });
    category.innerHTML = '';
    category.append(...links);
  }

  const accentColor = ['focus', 'fitness', 'fuel', 'recover']
    .find((categoryText) => block.classList.contains(categoryText));
  if (accentColor) {
    block.style.setProperty('--accent-color', `var(--color-${accentColor})`);
    block.style.setProperty('--category-text-color', `var(--color-${accentColor})`);
  } else {
    block.style.setProperty('--accent-color', 'var(--color-default-card)');
    block.style.setProperty('--category-text-color', 'var(--color-default-card-text)');
  }

  if (block.classList.contains('large')) {
    // create separate column for large image
    block.closest('.card-wrapper').classList.add('large');
    block.closest('.card-container').classList.add('has-large-card');
  }
}
