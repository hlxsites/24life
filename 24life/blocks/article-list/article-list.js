import {
  getMetadata,
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import { ffetchArticles } from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const filters = removeEmptyKeyOrValue(readBlockConfig(block));
  const isEmptyFilter = Object.keys(filters).length === 0;
  if (isEmptyFilter && document.location.pathname.startsWith('/category/')) {
    // auto-detect category, e.g. https://www.24life.com/category/lifestyle
    const parts = document.location.pathname.split('/');
    const askedCategory = parts[parts.length - 1];
    filters.categories = askedCategory.replace(/-/g, ' ');
    const firstContainer = document.createElement('div');
    firstContainer.innerHTML = `<h1>IN: ${filters.categories.toUpperCase()}</h1>`;
    block.before(firstContainer);
  } else if (isEmptyFilter && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    filters.authors = getMetadata('og:title');
  } else if (isEmptyFilter && document.location.pathname.startsWith('/collections/')) {
    filters.collections = new URL(document.location).pathname.split('/').pop();
    filters.collections = filters.collections?.replace(/-/g, ' ');
  }

  block.textContent = '';
  block.classList.add('card-container', 'three-columns');
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

async function displayNextEntries(iterator, block, loadMoreContainer) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 30; i++) {
    const next = iterator.next();
    if (next.done) {
      loadMoreContainer.remove();
    }
    const article = next.value;
    if (!article) break;

    const wrapper = document.createElement('div');
    const newBlock = createCardBlock(article, wrapper);
    if (article.section) {
      newBlock.classList.add(toClassName(article.section));
    }
    if (next.done) {
      block.append(wrapper);
    } else {
      loadMoreContainer.before(wrapper);
    }
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(newBlock);
  }
}

async function fetchArticlesAndAddCards(filters, block) {
  const articles = await ffetchArticles(`${window.hlx.codeBasePath}/articles.json`).all();
  const matches = articles
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase().includes(filters[key].toLowerCase()),
    ));

  const iterator = matches.values();

  // always add the button to load more. It will be removed once the iterator is done
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  loadMoreContainer.innerHTML = '<button class="article-list-load-more-button">Load more</button>';
  loadMoreContainer.addEventListener('click', () => {
    displayNextEntries(iterator, block, loadMoreContainer);
  });
  block.append(loadMoreContainer);

  // initial load the first entries
  await displayNextEntries(iterator, block, loadMoreContainer);
}
