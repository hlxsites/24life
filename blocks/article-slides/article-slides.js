import {
  createOptimizedPicture,
  decorateIcons,
  loadBlock,
  readBlockConfig,
  toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const articles = await fetchArticles(config);
  const slides = articles.map((article) => {
    const card = document.createElement('div');
    card.classList.add('slide');

    const imageP = document.createElement('p');
    imageP.classList.add('image');
    const picture = createOptimizedPicture(article.image);
    imageP.append(picture);
    card.append(imageP);

    const textP = document.createElement('p');
    textP.classList.add('text');

    const section = document.createElement('div');
    section.classList.add('section');
    section.append(article.section);
    textP.append(section);

    const title = document.createElement('div');
    title.classList.add('title');
    title.append(article.title);
    textP.append(title);

    const author = document.createElement('div');
    author.classList.add('author');
    author.append('BY ');
    author.append(article.author);
    textP.append(author);

    card.append(textP);
    return card;
  });
  block.append(...slides);
  // block.append(await createCarouselBlock(cards));
}

async function fetchArticles(config) {
  return ffetch('/articles.json')
    .chunks(config.limit || 9)
    .limit(config.limit || 9)
    .all();
}
