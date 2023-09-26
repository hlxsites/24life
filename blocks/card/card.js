import {
  buildBlock, createOptimizedPicture, decorateBlock, toClassName,
} from '../../scripts/lib-franklin.js';

/**
 * parameters: any of 'focus','fitness', 'fuel', 'recover', or 'large'
 * content structure: in first cell:
 *  - p > image
 *  - p > COLLECTIONS (optional)
 *  - title as linked h1, h2, h3, h4, h5, or h6
 *  - p > author with link (optional)
 */
export default function decorate(block) {
  const firstCell = block.firstElementChild.firstElementChild;

  // backward compatibility: also support headings
  const heading = firstCell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const para = document.createElement('p');
    para.classList.add('card-title');
    para.append(...heading.childNodes);
    heading.replaceWith(para);
  }

  firstCell.querySelector('a')?.parentElement.classList.add('card-title');

  // link the image
  const pictureParagraph = firstCell.querySelector('img').closest('p');
  const link = document.createElement('a');
  link.href = block.querySelector('.card-title a')?.href;
  link.append(...pictureParagraph.childNodes);
  link.classList.add('card-image');
  link.ariaLabel = firstCell.querySelector('.card-title').textContent;
  pictureParagraph.replaceWith(link);

  // reduce image size: on desktop the images are small, and on mobile they fill the screen width.
  const image = link.querySelector('img');
  replacePictureSizes(
    image,
    [
      { media: '(min-width: 900px)', width: '650' },
      { media: '(min-width: 500px)', width: '500' },
      { media: '(min-width: 400px)', width: '400' },
      { width: '300' },
    ],
  );

  if (firstCell.lastElementChild.classList.length === 0) {
    firstCell.lastElementChild.classList.add('card-author');
  }

  // often there is a collection like SUCCESS STORIES or GET STARTED. Multiple categories
  // can be comma separated.
  const collections = firstCell.querySelector('p:not([class])');
  collections?.classList.add('card-collections');
  if (collections?.textContent.trim().length > 0) {
    const links = collections.textContent.split(',')
      .map((collectionText) => {
        const a = document.createElement('a');
        a.href = `/collections/${toClassName(collectionText.trim())}`;
        a.append(collectionText.trim());
        return a;
      });
    collections.innerHTML = '';
    collections.append(...links);
  }

  const accentColor = ['focus', 'fitness', 'fuel', 'recover']
    .find((sectionText) => block.classList.contains(sectionText)
      || link.href.startsWith(`/${sectionText}/`));
  if (accentColor) {
    block.style.setProperty('--accent-color', `var(--color-${accentColor})`);
    block.style.setProperty('--category-text-color', `var(--color-${accentColor}-text)`);
  } else {
    block.style.setProperty('--accent-color', 'var(--color-default-card)');
    block.style.setProperty('--category-text-color', 'var(--color-default-card-text)');
  }

  if (block.classList.contains('large')) {
    // create separate column for large image
    block.closest('.card-wrapper').classList.add('large');
    block.closest('.card-container').classList.add('has-large-card');
  }
  if (block.classList.contains('right')) {
    // create separate column for large image
    block.closest('.card-wrapper').classList.add('right');
    block.closest('.card-container').classList.add('right');
  }
}

/* convenience function to create a block from a JSON object from articles.json */
export function createCardBlock(articleInfo, parent) {
  const firstCell = document.createElement('div');
  firstCell.append(articleInfo.title);

  function p(content) {
    const result = document.createElement('p');
    result.append(content);
    return result;
  }

  const picture = createOptimizedPicture(articleInfo.image);

  const heading = document.createElement('p');
  const link = document.createElement('a');
  link.href = articleInfo.path;
  link.textContent = articleInfo.title;
  heading.append(link);

  const authorLinks = document.createElement('p');
  authorLinks.append('By ');
  articleInfo.authors.split(',').forEach((author, index) => {
    const authorLink = document.createElement('a');
    authorLink.href = `/author/${toClassName(author)}`;
    authorLink.textContent = author;
    if (index > 0) {
      authorLinks.append(' and ');
    }
    authorLinks.append(authorLink);
  });

  const newBlock = buildBlock('card', {
    elems: [
      p(picture),
      p(articleInfo.collections),
      heading,
      authorLinks],
  });

  parent.append(newBlock);
  decorateBlock(newBlock);

  return newBlock;
}

function replacePictureSizes(image, imageSizes) {
  image.closest('picture').replaceWith(
    createOptimizedPicture(image.src, image.alt, image.loading === 'eager', imageSizes),
  );
}
