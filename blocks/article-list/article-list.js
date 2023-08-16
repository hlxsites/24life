import {
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const filters = removeEmptyKeyOrValue(readBlockConfig(block));
  const isEmptyFilter = Object.keys(filters).length === 0;
  if (isEmptyFilter && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    filters.author = new URL(document.location).pathname.split('/').pop();
  } else if (isEmptyFilter && document.location.pathname.startsWith('/collections/')) {
    filters.collections = new URL(document.location).pathname.split('/').pop();
    filters.collections = filters.collections?.replace(/-/g, ' ');
  }
  block.textContent = '';
  block.classList.add('card-container');
  // eslint-disable-next-line no-console
  await fetchArticlesAndAddCards(filters, block);
}

function removeEmptyKeyOrValue(obj) {
  if (!obj || typeof obj !== 'object') return {};

  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => key.trim() && value?.toString()?.trim(),
    ),
  );
}

async function fetchArticlesAndAddCards(filters, block) {
  const articles = await ffetch('/articles.json').all();

  await Promise.all(articles
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase().includes(filters[key].toLowerCase()),
    ))
    .filter(({ template }) => template === 'article')
    .map(async (article) => {
      const newBlock = createCardBlock(article, block);
      if (article.section) {
        newBlock.classList.add(toClassName(article.section));
      }
      await loadBlock(newBlock);
    }));
}
