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
  // if block has author class then set a boolean
  const isAuthor = block.classList.contains('author');

  const firstCell = block.firstElementChild.firstElementChild;
  firstCell.querySelector('h1, h2, h3, h4, h5, h6').classList.add('card-title');

  // link the image
  const pictureParagraph = firstCell.querySelector('img').closest('p');
  const link = document.createElement('a');
  link.href = block.querySelector('.card-title a')?.href;
  link.append(...pictureParagraph.childNodes);
  link.classList.add('card-image');
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

  if (!isAuthor) {
    // often there is a collection like SUCCESS STORIES or GET STARTED. Multiple categories
    // can be comma separated.
    const collections = firstCell.querySelector('p:not([class])');
    if (collections) {
      collections.classList.add('card-collections');
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

function p(content) {
  const result = document.createElement('p');
  result.append(content);
  return result;
}

/* convenience function to create a block from a JSON object from authors.json */
export function createAuthorCardBlock(author) {
  const picture = createOptimizedPicture(author.image);

  const heading = document.createElement('h3');
  const anchor = document.createElement('a');
  anchor.href = author.path;
  anchor.textContent = author.name;
  heading.append(anchor);

  const authorLinkContainer = document.createElement('div');
  authorLinkContainer.classList.add('author-links');
  // parse the author.links string and iterate over links
  addAuthorLinks(author, authorLinkContainer);

  const newBlock = buildBlock('card', {
    elems: [
      p(picture),
      heading,
      p(author.description),
      authorLinkContainer,
    ],
  });

  const wrapper = document.createElement('div');
  wrapper.append(newBlock);
  newBlock.classList.add('author');
  decorateBlock(newBlock);
  return wrapper;
}

function addAuthorLinks(author, authorLinkContainer) {
  if (!author.links) return;
  let arr = JSON.parse(author.links);
  if (arr.length > 0) {
    arr = arr[0].split(',');
  }
  const socialLinksContainer = document.createElement('div');
  socialLinksContainer.classList.add('social-links');
  function addSocialLink(socialLink) {
    const container = document.createElement('p');
    container.appendChild(socialLink);
    socialLinksContainer.appendChild(container);
  }
  arr.forEach((link) => {
    const socialLink = document.createElement('a');
    socialLink.href = link;
    socialLink.target = '_blank';
    if (link.includes('facebook')) {
      socialLink.innerHTML = '<span class="icon icon-facebook"><svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-facebook"></use></svg></span>';
      addSocialLink(socialLink);
    } else if (link.includes('twitter')) {
      socialLink.innerHTML = '<span class="icon icon-twitter"><svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-twitter"></use></svg></span>';
      addSocialLink(socialLink);
    } else if (link.includes('instagram')) {
      socialLink.innerHTML = '<span class="icon icon-instagram"><svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-instagram"></use></svg></span>';
      addSocialLink(socialLink);
    } else {
      const pElement = document.createElement('p');
      pElement.classList.add('other-links');
      socialLink.innerHTML = link;
      pElement.appendChild(socialLink);
      authorLinkContainer.appendChild(pElement);
    }
  });
  authorLinkContainer.prepend(socialLinksContainer);
}

/* convenience function to create a block from a JSON object from articles.json */
export function createCardBlock(articleInfo) {
  const wrapper = document.createElement('div');
  const firstCell = document.createElement('div');
  firstCell.append(articleInfo.title);

  const picture = createOptimizedPicture(articleInfo.image);

  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = articleInfo.path;
  link.textContent = articleInfo.title;
  heading.append(link);

  const author = document.createElement('p');
  const authorLink = document.createElement('a');
  authorLink.href = `/author/${articleInfo.authorId}`;
  authorLink.textContent = articleInfo.author;
  author.append('By ');
  author.append(authorLink);

  const newBlock = buildBlock('card', {
    elems: [
      p(picture),
      p(articleInfo.collections),
      heading,
      author],
  });

  wrapper.append(newBlock);
  decorateBlock(newBlock);

  return wrapper;
}

function replacePictureSizes(image, imageSizes) {
  image.closest('picture').replaceWith(
    createOptimizedPicture(image.src, image.alt, image.loading === 'eager', imageSizes),
  );
}
