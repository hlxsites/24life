import ffetch from '../../scripts/ffetch.js';
import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Shows list of authors, separated by role.
 *
 * Example block content:
 * | Staff  | Editorial Staff  |                  |
 * | Expert | Experts          | Some description |
 * | Writer | Contributing     | Writers          |
 */
export default async function decorate(block) {
  const allAuthors = await ffetch('/authors.json').chunks(5000).all();
  const roles = [...block.children].map((row) => {
    const cells = [...row.children];
    return ({
      filter: cells[0].textContent,
      heading: cells[1].textContent,
      description: cells[2].textContent,
      style: cells[3].textContent,
    });
  });
  block.textContent = '';
  for (const role of roles) {
    block.append(createMarkupForRole(role, block, allAuthors));
  }
}

function loadNext30Entries(iterator, authorCards, loadMoreContainer) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 30; i++) {
    const next = iterator.next();
    const author = next.value;
    if (!author) break;
    authorCards.append(createAuthorCardBlock(author));
    if (next.done) {
      loadMoreContainer.remove();
    }
  }
}

function createMarkupForRole(role, block, allAuthors) {
  const { filter, heading, description } = role;
  const authors = allAuthors
    .filter((author) => author.role.toLowerCase() === filter.toLowerCase())
    .toSorted((a, b) => a.name.localeCompare(b.name));

  const iterator = makeArrayIterator(authors);

  const result = document.createElement('div');
  const headingElement = document.createElement('h2');
  headingElement.textContent = heading;
  result.append(headingElement);
  result.append(p(description));

  const authorCards = document.createElement('div');
  authorCards.classList.add('author-grid');

  result.append(authorCards);

  // always add the button to load more authors. It will be removed once the iterator is done
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('author-load-more-container');
  loadMoreContainer.innerHTML = '<button class="author-list-load-more-button">Load more</button>';
  loadMoreContainer.addEventListener('click', () => {
    loadNext30Entries(iterator, authorCards, loadMoreContainer);
  });
  result.append(loadMoreContainer);

  // initial load the first 30 entries
  loadNext30Entries(iterator, authorCards, loadMoreContainer);
  return result;
}

function makeArrayIterator(array) {
  let nextIndex = 0;
  return {
    next() {
      const result = { value: array[nextIndex], done: nextIndex + 1 >= array.length };
      nextIndex += 1;
      return result;
    },
  };
}

function p(content) {
  const result = document.createElement('p');
  if (content) result.append(content);
  return result;
}

/* create a block from a JSON object from authors.json */
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

  const container = document.createElement('div');
  container.classList.add('author-list-item');
  container.append(
    pictureP,
    heading,
    p(author.description),
    authorLinkContainer,
  );
  return container;
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
