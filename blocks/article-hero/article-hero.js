import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.innerText = '';
  block.append(createOptimizedPicture(
    getMetadata('og:image'),
    getMetadata('og:title'),
    true,
  ));

  const overlay = document.createElement('div');
  overlay.classList.add('hero-overlay');

  const collections = document.createElement('div');
  collections.classList.add('hero-collections');
  const links = getMetadata('collections')?.split(',')
    .map((collectionText) => {
      const a = document.createElement('a');
      a.href = `/collections/${toClassName(collectionText.trim())}`;
      a.append(collectionText.trim());
      return a;
    });
  collections.append(...links);

  overlay.append(collections);

  const h1 = document.createElement('h1');
  h1.append(getMetadata('og:title'));
  overlay.append(h1);
  overlay.append('By ');

  const authorLink = document.createElement('a');
  authorLink.href = `/author/${getMetadata('author-id')}`;
  authorLink.textContent = getMetadata('author');
  overlay.append(authorLink);

  block.append(overlay);
}
