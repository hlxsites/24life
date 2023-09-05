import { ffetcharticles } from '../../scripts/ffetch.js';
import {
  createOptimizedPicture, decorateIcons, readBlockConfig,
} from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const tempArray = [];
  const arrayFilters = [];
  const arrayHeading = [];
  const arrayDes = [];
  const arrayStyle = [];
  const allauthors = await ffetcharticles('/authors.json').all();
  // const { filter } = readBlockConfig(block);
  // block.textContent = '';
  [...block.children].forEach((row, r) => {;
    arrayFilters.push([...row.children][0].textContent);
    arrayHeading.push([...row.children][1].textContent);
    arrayDes.push([...row.children][2].textContent);
    arrayStyle.push([...row.children][3].textContent);
    row.textContent = '';
  });
  console.log(arrayFilters);
  console.log(arrayDes);
  // const arrayFilters = ['Staff', 'Expert', 'Writer'];
  // eslint-disable-next-line
  for (let i = 0; i < arrayFilters.length; i++) {let filter = arrayFilters[i]; console.log(filter); await fetchAuthors(arrayFilters[i], block, tempArray, allauthors, arrayHeading[i], arrayDes[i], arrayStyle[i]).catch((e) => console.log(e));};
}

async function fetchAuthors(filter, block, tempArray, allauthors, head, desc, sty) {
  // get all authors from authors.json and filter them by role
  const authors = allauthors.filter((author) => author.role === filter);
  const total = tempArray.reduce((sum, x) => { let sum1 = sum; sum1 += x; return sum1; }, 0);
  console.log(total);
  // sort author list by name
  authors.sort((a, b) => a.name.localeCompare(b.name));
  // create the first 6 authors
  const numInitialLodedAuthors = 30;
  const firstAuthors = authors.slice(0, numInitialLodedAuthors);
  const loadExperts = document.createElement('div');
  await firstAuthors.forEach((author) => {
    const newBlock = createAuthorCardBlock(author);
    loadExperts.append(newBlock);
  });
  block.append(loadExperts);
  // create load more button if there are more authors than shown
  console.log(tempArray);
  const counter = (document.querySelectorAll('.author-list-container .author-list.block .author-list-item').length - total) / numInitialLodedAuthors;
  if ((authors.length - (numInitialLodedAuthors * counter)) > numInitialLodedAuthors) {
    createLoadMoreButton(numInitialLodedAuthors, authors, block, total, loadExperts);
  } else { tempArray.push(authors.length); }
}

function createLoadMoreButton(numInitialLodedAuthors, authors, block, total, loadExperts) {
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('author-load-more-container');
  const loadMoreButton = document.createElement('button');
  loadMoreContainer.append(loadMoreButton);
  loadMoreButton.classList.add('author-list-load-more-button');
  loadMoreButton.textContent = 'Load more';
  loadMoreButton.addEventListener('click', async () => {
    const counter = (document.querySelectorAll('.author-list-container .author-list.block .author-list-item').length - total) / numInitialLodedAuthors;
    // eslint-disable-next-line
    const nextAuthors = authors.slice(numInitialLodedAuthors * counter, (numInitialLodedAuthors * counter) + numInitialLodedAuthors);
    await nextAuthors.forEach((author) => {
      const newBlock = createAuthorCardBlock(author);
      loadExperts.append(newBlock);
    });
    // eslint-disable-next-line
    if ((authors.length - (numInitialLodedAuthors * counter)) > numInitialLodedAuthors) { loadExperts.append(loadMoreContainer); }
  });
  loadExperts.append(loadMoreContainer);
}

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
