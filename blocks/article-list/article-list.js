import {
  getMetadata,
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const filters = removeEmptyKeyOrValue(readBlockConfig(block));
  const isEmptyFilter = Object.keys(filters).length === 0;
  if (isEmptyFilter && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    filters.authors = getMetadata('og:title');
  } else if (isEmptyFilter && document.location.pathname.startsWith('/collections/')) {
    filters.collections = new URL(document.location).pathname.split('/').pop();
    filters.collections = filters.collections?.replace(/-/g, ' ');
  }
  block.textContent = '';
  block.classList.add('card-container', 'three-columns');
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
  const numInitialLodedArticles = 30;
  const actualLength = articles.filter((article) => Object.keys(filters).every(
    (key) => article[key]?.toLowerCase().includes(filters[key].toLowerCase()),
  )).length;
  await Promise.all(articles
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase().includes(filters[key].toLowerCase()),
    )).slice(0, numInitialLodedArticles)
    .map(async (article) => {
      const wrapper = document.createElement('div');
      const newBlock = createCardBlock(article, wrapper);
      if (article.section) {
        newBlock.classList.add(toClassName(article.section));
      }
      block.append(wrapper);
      await loadBlock(newBlock);
    }));
  const counter = document.querySelectorAll('.author .card-wrapper').length / 30;
  if ((actualLength - (numInitialLodedArticles * counter)) > 30) {
  // eslint-disable-next-line
    const { loadMoreContainer } = createLoadMoreButton(numInitialLodedArticles, articles, filters, actualLength, block);
  }
}
// eslint-disable-next-line
function createLoadMoreButton(numInitialLodedArticles, articles, filters, actualLength, block) {
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  const loadMoreButton = document.createElement('button');
  loadMoreContainer.append(loadMoreButton);
  loadMoreButton.classList.add('article-list-load-more-button');
  loadMoreButton.textContent = 'Load more';
  loadMoreButton.addEventListener('click', async () => {
    const counter = document.querySelectorAll('.author .card-wrapper').length / 30;
    await Promise.all(articles
      .filter((article) => Object.keys(filters).every(
        (key) => article[key]?.toLowerCase().includes(filters[key].toLowerCase()),
      )).slice(numInitialLodedArticles * counter, (numInitialLodedArticles * counter) + 30)
      .map(async (article) => {
        const wrapper = document.createElement('div');
        const newBlock = createCardBlock(article, wrapper);
        if (article.section) {
          newBlock.classList.add(toClassName(article.section));
        }
        block.append(wrapper);
        await loadBlock(newBlock);
      }));
    block.append(loadMoreContainer);
  });
  const counter = document.querySelectorAll('.author .card-wrapper').length / 30;
  // eslint-disable-next-line
  if ((actualLength - (numInitialLodedArticles * counter)) > 30) { block.append(loadMoreContainer); } 
  else block.remove(loadMoreContainer);
  return { loadMoreContainer };
}
