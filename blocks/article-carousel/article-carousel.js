import {
  buildBlock, decorateBlock, loadBlock, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

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

export default async function decorate(block) {
  const { section } = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('carousel-container');
  const cards = await fetchArticlesAndCreateCards(section);

  // TODO: clean up this mess
  // const groups = [
  //   document.createDocumentFragment('div'),
  //   document.createDocumentFragment('div'),
  //   document.createDocumentFragment('div'),
  // ];
  // // put cards in group of 3
  // cards.forEach((card, index) => {
  //   groups[Math.floor(index / 3)][0].append(card);
  // });
  // TODO: also support groups of 2 and 1?

  block.append(await createCarouselBlock(cards));
}

async function fetchArticlesAndCreateCards(filterSection) {
  const dummyParent = document.createElement('div');
  return ffetch('/articles.json')
    .chunks(20)
    .filter(({ template }) => template === 'article')
    .filter(({ section }) => (filterSection ? section === filterSection : true))
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
