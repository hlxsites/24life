import {
  buildBlock, decorateBlock, loadBlocks, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

function createCarouselBlock() {
  const wrapper = document.createElement('div');
  const newBlock = buildBlock('carousel', 'a');
  wrapper.append(newBlock);
  decorateBlock(newBlock);
  return wrapper;
}

export default function decorate(block) {
  let { by } = readBlockConfig(block);
  if (!by && document.location.pathname.startsWith('/author/')) {
    // auto-detect author, e.g. https://www.24life.com/author/24life
    by = new URL(document.location).pathname.split('/').pop();
  }
  block.textContent = '';
  // block.classList.add('card-container');
  // eslint-disable-next-line no-console
  const carousel = createCarouselBlock();
  block.append(carousel);
  loadBlocks(block);
  // fetchArticlesAndAddCards(by, carousel.querySelector('.block'))
  //   .then(() => loadBlocks(block))
  //   .catch((e) => console.error(e));
}

async function fetchArticlesAndAddCards(by, container) {
  const articles = await ffetch('/articles.json').all();

  articles
    .filter((article) => (by ? article['author-id'] === by : true))
    .filter(({ template }) => template === 'article')
    .forEach((article) => {
      const newBlock = createCardBlock(article);
      if (article.section) {
        newBlock.querySelector('.card.block').classList.add(toClassName(article.section));
      }

      // unwrap card-wrapper
      container.append(newBlock.firstElementChild);
    });
}
