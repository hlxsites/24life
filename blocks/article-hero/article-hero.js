import {
  createOptimizedPicture, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  block.innerText = '';
  block.append(createOptimizedPicture(
    data.image,
    data.title,
    true,
  ));

  // if this is a collection page e.g. host/collections/workouts
  if (data.collection) {
    block.classList.add('hero-collection');
    const overlay = document.createElement('div');
    overlay.classList.add('hero-collection-overlay');
    const h1 = document.createElement('h1');
    h1.append(data.collection);
    h1.classList.add('hero-collection-title');
    overlay.append(h1);
    const p = document.createElement('p');
    p.append(data.subtitle);
    p.classList.add('hero-collection-subtitle');
    overlay.append(p);
    block.append(overlay);
    return;
  }
  const overlay = document.createElement('div');
  overlay.classList.add('hero-overlay');

  const collections = document.createElement('div');
  collections.classList.add('hero-collections');
  const links = data.collections?.split(',')
    .map((collectionText) => {
      const a = document.createElement('a');
      a.href = `/collections/${toClassName(collectionText.trim())}`;
      a.append(collectionText.trim());
      return a;
    });
  collections.append(...links);

  overlay.append(collections);

  const h1 = document.createElement('h1');
  h1.append(data.title);
  h1.classList.add('hero-title');
  overlay.append(h1);
  overlay.append('By ');

  const authorLink = document.createElement('a');
  authorLink.href = `/author/${toClassName(data.author)}`;
  authorLink.textContent = data.author;
  overlay.append(authorLink);

  block.append(overlay);
}
