import {
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const filters = readBlockConfig(block);
  if (!Object.keys(filters) && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    filters.author = new URL(document.location).pathname.split('/').pop();
  }
  block.textContent = '';
  block.classList.add('card-container', 'three-columns');
  // eslint-disable-next-line no-console
  await fetchArticlesAndAddCards(filters, block);
}

async function fetchArticlesAndAddCards(filters, block) {
  const articles = await ffetch('/articles.json').all();

  await Promise.all(articles
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase() === filters[key].toLowerCase(),
    ))
    .filter(({ template }) => template === 'article')
    .map(async (article) => {
      const wrapper = document.createElement('div');
      const newBlock = createCardBlock(article, wrapper);
      if (article.section) {
        newBlock.classList.add(toClassName(article.section));
      }
      block.append(wrapper);
      await loadBlock(newBlock);
    }));
}
