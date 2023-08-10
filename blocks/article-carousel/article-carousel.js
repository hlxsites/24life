import {
  buildBlock, decorateBlock, loadBlocks, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

function createCarouselBlock(content) {
  const wrapper = document.createElement('div');
  const newBlock = buildBlock('carousel', content);
  wrapper.append(newBlock);
  decorateBlock(newBlock);
  return wrapper;
}

export default async function decorate(block) {
  const { section } = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('carousel-container');
  // eslint-disable-next-line no-console
  const cards = await fetchArticlesAndCreateCards(section);
  // TODO: clean up this mess
  const groups = [
    [document.createDocumentFragment('div')],
    [document.createDocumentFragment('div')],
    [document.createDocumentFragment('div')],
  ];
  // put cards in group of 3
  cards.forEach((card, index) => {
    groups[Math.floor(index / 3)][0].append(card);
  });
  // TODO: also support groups of 2 and 1?
  const carousel = createCarouselBlock(groups);
  block.append(carousel);
  await loadBlocks(block);
}

async function fetchArticlesAndCreateCards(filterSection) {
  return ffetch('/articles.json')
    .filter(({ template }) => template === 'article')
    .filter(({ section }) => (filterSection ? section === filterSection : true))
    .limit(9)
    .map((article) => {
      const newBlock = createCardBlock(article);
      if (article.section) {
        newBlock.querySelector('.card.block').classList.add(toClassName(article.section));
      }

      // unwrap card-wrapper
      return newBlock.firstElementChild;
    })
    .all();
}
