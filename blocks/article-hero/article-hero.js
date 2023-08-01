import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.append(createOptimizedPicture(
    getMetadata('og:image'),
    getMetadata('og:title'),
    true,
  ));

  const overlay = document.createElement('div');
  overlay.classList.add('hero-overlay');

  const collections = document.createElement('div');
  collections.classList.add('hero-collections');
  // todo: add links to collections
  collections.append(getMetadata('collections')?.split(','));
  overlay.append(collections);

  const h1 = document.createElement('h1');
  h1.append(getMetadata('og:title'));
  overlay.append(h1);

  // TODO: add author link
  overlay.append(getMetadata('author'));

  block.append(overlay);
}
