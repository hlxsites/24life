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

  const authorLink = document.createElement('a');
  authorLink.href = `/author/${toClassName(data.author)}`;
  authorLink.textContent = data.author;
  overlay.append(authorLink);
  window.addEventListener('resize', adjustHeroHeight);
  window.addEventListener('load', adjustHeroHeight);

  /**
   * If the image height is smaller than the viewport height
   * set the container height to the image height
   */
  function adjustHeroHeight() {
    const image = document.querySelector('.article-hero img');
    let articleHeroContainer = document.querySelector('div.article-hero.block');
    if (image.height < window.innerHeight) {
      articleHeroContainer.style.height = `${image.height}px`;
    } else {
      articleHeroContainer.style.height = '100vh';
    }
    // if the window width is less than 600px,
    // add the hero-title as the first child of the next-sibling of article-hero-container
    if (window.innerWidth < 600) {
      articleHeroContainer = document.querySelector('div.article-hero-container');
      const nextSibling = articleHeroContainer.nextElementSibling;
      // query hero-overlay
      const heroOverlay = document.querySelector('div.section.article-hero-container div.hero-overlay');
      // create a copy of hero-overlay
      const heroOverlayCopy = heroOverlay.cloneNode(true);
      heroOverlayCopy.classList.add('hero-overlay-smaller-screen');
      // prepend only if the nextSibling does not have a child with
      // class hero-overlay-smaller-screen
      if (!nextSibling.querySelector('.hero-overlay-smaller-screen')) {
        nextSibling.prepend(heroOverlayCopy);
      }
    } else {
      // if the window width is greater than 600px,
      // remove the hero-overlay-smaller-screen
      const heroOverlaySmallerScreen = document.querySelector('div.hero-overlay.hero-overlay-smaller-screen');
      if (heroOverlaySmallerScreen) {
        heroOverlaySmallerScreen.remove();
      }
    }
  }
  block.append(overlay);
}
