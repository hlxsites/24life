import {
  loadBlock, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  const links = [...block.querySelectorAll('a')];

  links.forEach(async (link) => {
    const articleURL = new URL(link.innerHTML);
    await fetchArticleAndCreateCard(articleURL.pathname, link);
    block.firstElementChild.remove(); // remove the top node
    link.classList.remove('button', 'primary');
    block.append(link); // append new node to bottom
  });
}

async function fetchArticleAndCreateCard(path, link) {
  const articles = await ffetch('/articles.json').chunks(700).all();
  await Promise.all(articles
    // find the matching article via the path
    .filter((article) => article.path?.toLowerCase() === path.toLowerCase())
    .map(async (article) => {
      const wrapper = document.createElement('div');
      const card = createCardBlock(article, wrapper);
      // set the section color
      if (article.section) {
        card.classList.add(toClassName(article.section));
      }
      link.innerHTML = '';
      link.append(wrapper);
      await loadBlock(card);
    }));
}
