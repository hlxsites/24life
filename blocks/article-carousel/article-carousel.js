import {
  buildBlock, decorateBlock, loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const filters = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('carousel-container');
  const cards = await fetchArticlesAndCreateCards(filters);
  block.append(await createCarouselBlock(cards));
}

async function fetchArticlesAndCreateCards(filters) {
  const dummyParent = document.createElement('div');
  return ffetch('/articles.json')
    .chunks(20)
    .filter(({ template }) => template === 'article')
    // make sure all filters match
    .filter((article) => Object.keys(filters).every(
      (key) => article[key]?.toLowerCase() === filters[key].toLowerCase(),
    ))
    .limit(9)
    .map(async (article) => {
      const card = createCardBlock(article, dummyParent);
      if (article.section) {
        card.classList.add(toClassName(article.section));
      }

      await loadBlock(card);
      return card;
    })
    .all();
}

async function createCarouselBlock(content) {
  const wrapper = document.createElement('div');
  const newBlock = buildBlock('carousel', '');
  wrapper.append(newBlock);
  newBlock.textContent = '';
  newBlock.append(...content);
  decorateBlock(newBlock);
  await loadBlock(newBlock);

  return wrapper;
}
