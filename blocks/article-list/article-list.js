import {
  loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default function decorate(block) {
  let { by } = readBlockConfig(block);
  if (!by && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    by = new URL(document.location).pathname.split('/').pop();
  }
  block.textContent = '';
  block.classList.add('card-container');
  // eslint-disable-next-line no-console
  fetchArticlesAndAddCards(by, block).catch((e) => console.log(e));
}

async function fetchArticlesAndAddCards(by, block) {
  const articles = await ffetch('/articles.json').all();

  articles
    .filter((article) => (by ? article['author-id'] === by : true))
    .filter(({ template }) => template === 'article')
    .forEach((article) => {
      const newBlock = createCardBlock(article, block);
      if (article.section) {
        newBlock.classList.add(toClassName(article.section));
      }
      loadBlock(newBlock);
    });
}
