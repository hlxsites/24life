import {
  buildBlock, decorateBlock, loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

async function createCarouselBlock(content) {
  const wrapper = document.createElement('div');
  const newBlock = buildBlock('carousel', content);
  wrapper.append(newBlock);
  decorateBlock(newBlock);
  await loadBlock(wrapper.firstElementChild);

  return wrapper;
}

export default async function decorate(block) {
  const { section } = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('carousel-container');
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

  block.append(await createCarouselBlock(groups));
}

async function fetchArticlesAndCreateCards(filterSection) {
  return ffetch('/articles.json')
    .chunks(20)
    .filter(({ template }) => template === 'article')
    .filter(({ section }) => (filterSection ? section === filterSection : true))
    .limit(9)
    .map(async (article) => {
      const card = createCardBlock(article);
      if (article.section) {
        card.querySelector('.card.block').classList.add(toClassName(article.section));
      }

      // unwrap card-wrapper
      await loadBlock(card.firstElementChild);
      return card.firstElementChild;
    })
    .all();
}
