import { ffetcharticles } from '../../scripts/ffetch.js';
import {
  createOptimizedPicture, decorateIcons, readBlockConfig,
} from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const { filter } = readBlockConfig(block);
  block.textContent = '';
  // eslint-disable-next-line no-console
  fetchAuthors(filter, block).catch((e) => console.log(e));
}

async function fetchAuthors(filter, block) {
  // get all authors from authors.json and filter them by role
  const authors = await ffetcharticles('/authors.json').filter((author) => author.role === filter).all();
  // sort author list by name
  authors.sort((a, b) => a.name.localeCompare(b.name));
  // create the first 6 authors
  const numInitialLodedAuthors = 30;
  const firstAuthors = authors.slice(0, numInitialLodedAuthors);
  await firstAuthors.forEach((author) => {
    const newBlock = createAuthorCardBlock(author);
    block.append(newBlock);
  });
  // create load more button if there are more authors than shown
  const counter = document.querySelectorAll('.author-list-container > .author-list-wrapper')[1].querySelectorAll('.author-list-item').length / numInitialLodedAuthors;
  if ((authors.length - (numInitialLodedAuthors * counter)) > numInitialLodedAuthors) {
    createLoadMoreButton(numInitialLodedAuthors, authors, block);
  }
}

function createLoadMoreButton(numInitialLodedAuthors, authors, block) {
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('author-load-more-container');
  const loadMoreButton = document.createElement('button');
  loadMoreContainer.append(loadMoreButton);
  loadMoreButton.classList.add('author-list-load-more-button');
  loadMoreButton.textContent = 'Load more';
  loadMoreButton.addEventListener('click', async () => {
    const counter = document.querySelectorAll('.author-list-container > .author-list-wrapper')[1].querySelectorAll('.author-list-item').length / numInitialLodedAuthors;
    // eslint-disable-next-line
    const nextAuthors = authors.slice(numInitialLodedAuthors * counter, (numInitialLodedAuthors * counter) + numInitialLodedAuthors);
    await nextAuthors.forEach((author) => {
      const newBlock = createAuthorCardBlock(author);
      block.append(newBlock);
    });
    // eslint-disable-next-line
    if ((authors.length - (numInitialLodedAuthors * counter)) > numInitialLodedAuthors) { block.append(loadMoreContainer); }
  });
  block.append(loadMoreContainer);
}

// function createLoadMoreButton() {
//   const loadMoreContainer = document.createElement('div');
//   loadMoreContainer.classList.add('author-load-more-container');
//   const loadMoreButton = document.createElement('button');
//   loadMoreContainer.append(loadMoreButton);
//   loadMoreButton.classList.add('author-list-load-more-button');
//   loadMoreButton.textContent = 'Load more';
//   return { loadMoreButton, loadMoreContainer };
// }

function buildAuthorListItem(className, content) {
  const container = document.createElement('div');
  container.classList.add(className);
  container.append(...content);
  return container;
}

function p(content) {
  const result = document.createElement('p');
  if (content) result.append(content);
  return result;
}

/* convenience function to create a block from a JSON object from authors.json */
function createAuthorCardBlock(author) {
  const pictureP = p();
  pictureP.classList.add('author-image');
  if (author.image) {
    pictureP.append(createOptimizedPicture(author.image, 'author-image', true));
  }

  const heading = document.createElement('h3');
  const anchor = document.createElement('a');
  anchor.href = author.path;
  anchor.textContent = author.name;
  heading.append(anchor);

  const authorLinkContainer = document.createElement('div');
  authorLinkContainer.classList.add('author-links');
  // parse the author.links string and iterate over links
  addAuthorLinks(author, authorLinkContainer);

  return buildAuthorListItem('author-list-item', [
    pictureP,
    heading,
    p(author.description),
    authorLinkContainer,
  ]);
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
    socialLinksContainer.appendChild(p(socialLink));
  }
  arr.forEach((link) => {
    const socialLink = document.createElement('a');
    socialLink.href = link;
    socialLink.target = '_blank';
    if (link.includes('facebook')) {
      socialLink.innerHTML = '<span class="icon icon-facebook"></span>';
      addSocialLink(socialLink);
    } else if (link.includes('twitter')) {
      socialLink.innerHTML = '<span class="icon icon-twitter"></span>';
      addSocialLink(socialLink);
    } else if (link.includes('instagram')) {
      socialLink.innerHTML = '<span class="icon icon-instagram"></span>';
      addSocialLink(socialLink);
    } else {
      const pElement = document.createElement('p');
      pElement.classList.add('other-links');
      socialLink.innerHTML = link;
      pElement.appendChild(socialLink);
      authorLinkContainer.appendChild(pElement);
    }
    decorateIcons(socialLinksContainer);
  });
  authorLinkContainer.prepend(socialLinksContainer);
}
