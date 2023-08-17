import {
  createOptimizedPicture,
  decorateIcons,
  loadBlock,
  readBlockConfig,
  toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

function plainText(text) {
  const fragment = document.createElement('div');
  fragment.append(text);
  return fragment.innerHTML;
}

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

    card.innerHTML = `
    <p class="image">${createOptimizedPicture(article.image).outerHTML}</p>
    <div class="text">
        <p class="section">${plainText(article.section)}</p>
        <p class="title">${plainText(article.title)}</p>
        <p class="author">BY ${plainText(article.author)}</p>
    </div> `;

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
