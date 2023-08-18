import {
  createOptimizedPicture,
  readBlockConfig,

} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';

/**
 * Generic carousel block, which can be used for any content or blocks.
 * Each row is a slide.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const articles = await fetchArticles(config);
  const slides = articles.map((article, index) => {
    const card = document.createElement('div');
    card.classList.add('slide');
    card.innerHTML = `
    <div class="image">${createOptimizedPicture(article.image, article.title, index === 0).outerHTML}</div>
    <div class="text">
        <p class="section">${plainText(article.section)}</p>
        <p class="title">${plainText(article.title)}</p>
        <p class="author">BY ${plainText(article.author)}</p>
    </div> `;

    if (index === 0) {
      card.classList.add('active');
    }
    return card;
  });

  // TODO: add buttons

  block.append(...slides);
  // block.append(await createCarouselBlock(cards));
}

async function fetchArticles(config) {
  return ffetch('/articles.json')
    .chunks(config.limit || 9)
    .limit(config.limit || 9)
    .all();
}

/**
 * make text safe to use in innerHTML
 * @param text any string
 * @return {string} sanitized html string
 */
function plainText(text) {
  const fragment = document.createElement('div');
  fragment.append(text);
  return fragment.innerHTML;
}
