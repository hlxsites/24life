import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.append(createOptimizedPicture(
    getMetadata('og:image'),
    getMetadata('og:title'),
    true,
  ));

  const collections = document.createElement('div');
  collections.classList.add('hero-collections');
  // todo: add links to collections
  collections.append(getMetadata('collections').split(','));
  block.append(collections);

  const h1 = document.createElement('h1');
  h1.append(getMetadata('og:title'));
  block.append(h1);

  // TODO: add author link
  block.append(getMetadata('author'));
}
