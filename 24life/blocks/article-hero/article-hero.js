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

  const overlay = document.createElement('div');
  overlay.classList.add('hero-overlay');

  const collections = document.createElement('div');
  collections.classList.add('hero-collections');
  const links = data.collections?.split(',')
    .map((collectionText) => {
      const a = document.createElement('a');
      a.href = `${window.hlx.codeBasePath}/collections/${toClassName(collectionText.trim())}`;
      a.append(collectionText.trim());
      return a;
    });
  collections.append(...links);

  overlay.append(collections);

  const h1 = document.createElement('h1');
  h1.append(data.title);
  h1.classList.add('hero-title');
  overlay.append(h1);

  const authorLinks = document.createElement('span');
  authorLinks.append('By ');
  data.authors.split(',').forEach((author, index) => {
    const authorLink = document.createElement('a');
    authorLink.href = `${window.hlx.codeBasePath}/author/${toClassName(author)}`;
    authorLink.textContent = author;
    if (index > 0) {
      authorLinks.append(' and ');
    }
    authorLinks.append(authorLink);
    overlay.append(authorLinks);
  });
  block.append(overlay);
}
