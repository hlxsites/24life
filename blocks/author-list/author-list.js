import ffetch from '../../scripts/ffetch.js';
import {
  readBlockConfig, loadBlocks, createOptimizedPicture, decorateBlock,
} from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const { filter } = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('card-container');
  // eslint-disable-next-line no-console
  fetchAuthors(filter, block).catch((e) => console.log(e));
}

async function fetchAuthors(filter, block) {
  const authors = await ffetch('/authors.json').all();
  // sort author list by name
  authors.sort((a, b) => a.name.localeCompare(b.name));
  authors.filter((author) => author.role === filter)
    .forEach((author) => {
      const newBlock = createAuthorCardBlock(author);
      block.append(newBlock);
    });
  loadBlocks(block);
}

function buildAuthorCardBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [content];
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName);
  table.forEach((val) => {
    if (val) {
      if (typeof val === 'string') {
        blockEl.innerHTML += val;
      } else {
        blockEl.appendChild(val);
      }
    }
  });
  return (blockEl);
}

function p(content) {
  const result = document.createElement('p');
  result.append(content);
  return result;
}

/* convenience function to create a block from a JSON object from authors.json */
function createAuthorCardBlock(author) {
  const picture = author.image;
  const heading = document.createElement('h3');
  const anchor = document.createElement('a');
  anchor.href = author.path;
  anchor.textContent = author.name;
  heading.append(anchor);

  const authorLinkContainer = document.createElement('div');
  authorLinkContainer.classList.add('author-links');
  // parse the author.links string and iterate over links
  addAuthorLinks(author, authorLinkContainer);

  const newBlock = buildAuthorCardBlock('card', [
    p(picture),
    heading,
    p(author.description),
    authorLinkContainer,
  ]);

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
