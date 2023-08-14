import {
  buildBlock, decorateBlock, decorateIcons, getMetadata, toClassName,
} from '../../scripts/lib-franklin.js';

export default async function decorate(doc) {
  if (getMetadata('section')) {
    doc.querySelector('main').classList.add(`color-${toClassName(getMetadata('section'))}`);
  }

  const firstSection = doc.querySelector('main .section');
  firstSection.before(createSectionWithHeroBlock(
    doc.querySelector('main .section h1'),
    doc.querySelector('main .section img'),
  ));

  const firstContent = doc.querySelector('main .section .default-content-wrapper');
  firstContent.before(createSocialMediaButtons());

  const lastContent = [...doc.querySelectorAll('main .section .default-content-wrapper')].at(-1);
  lastContent.after(createArticleCarousel());
  lastContent.after(createAuthorBlock());
  lastContent.after(createSocialMediaButtons());
}

function createNewSection() {
  const section = document.createElement('div');
  section.classList.add('section', 'article-hero-container');
  section.dataset.sectionStatus = 'initialized';
  section.style.display = 'none';
  return section;
}

function createSectionWithHeroBlock(h1, img) {
  const section = createNewSection();
  section.classList.add('article-hero-container');

  const wrapper = document.createElement('div');
  const newBlock = buildBlock(
    'article-hero',
    [
      ['title', getMetadata('og:title')],
      ['image', getMetadata('og:image')],
      ['collections', getMetadata('collections')],
      ['author', getMetadata('author')],
    ],
  );
  wrapper.append(newBlock);
  decorateBlock(newBlock);

  // remove title and image from existing section
  h1.remove();
  img.remove();

  section.append(wrapper);
  return section;
}

function createAuthorBlock() {
  const container = document.createElement('div');
  const newBlock = buildBlock('article-author', '');
  container.append(newBlock);
  decorateBlock(newBlock);
  return container;
}

function createArticleCarousel() {
  const container = document.createElement('div');
  const carouselTitle = document.createElement('p');
  carouselTitle.classList.add('article-carousel-title');
  carouselTitle.innerHTML = `<strong>${getMetadata('section')}</strong> - MORE TO EXPLORE`;

  container.append(carouselTitle);
  const newBlock = buildBlock('article-carousel', [['Section', getMetadata('section')]]);
  container.append(newBlock);
  decorateBlock(newBlock);
  return container;
}

function createSocialMediaButtons() {
  const socialMediaButtons = document.createElement('div');
  socialMediaButtons.innerHTML = `
  <div class="article-social-media-buttons">
          <a aria-label="share this page on twitter"  target="_blank" href="https://twitter.com/share?url=">
              <span class="icon icon-twitter-alt"></span>
          </a>
      
          <a aria-label="share this page on facebook" target="_blank" href="http://www.facebook.com/share.php?u=">
              <span class="icon icon-facebook"></span>
          </a>
      
          <a aria-label="share this page on pinterest" target="_blank" href="http://pinterest.com/pin/create/button/?url=">
              <span class="icon icon-pinterest"></span>
          </a>
  </div>`;
  socialMediaButtons.querySelectorAll('a').forEach((a) => {
    a.href += window.location.href;
  });
  // noinspection JSIgnoredPromiseFromCall
  decorateIcons(socialMediaButtons);
  return socialMediaButtons;
}
