import ffetch from '../../scripts/ffetch.js';
import { readBlockConfig, loadBlocks } from '../../scripts/lib-franklin.js';
import { createAuthorCardBlock } from '../card/card.js';

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
