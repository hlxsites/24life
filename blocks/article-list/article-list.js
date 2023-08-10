import {
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default function decorate(block) {
  const filters = readBlockConfig(block);
  if (!Object.keys(filters) && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    filters.author = new URL(document.location).pathname.split('/').pop();
  }
  block.textContent = '';
  block.classList.add('card-container');
  // eslint-disable-next-line no-console
  fetchArticlesAndAddCards(filters, block).catch((e) => console.log(e));
}

async function fetchArticlesAndAddCards(filters, block) {
  const articles = await ffetch('/articles.json').all();

  articles
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase() === filters[key].toLowerCase(),
    ))
    .filter(({ template }) => template === 'article')
    .forEach((article) => {
      const newBlock = createCardBlock(article, block);
      if (article.section) {
        newBlock.classList.add(toClassName(article.section));
      }
      loadBlock(newBlock);
    });
}
