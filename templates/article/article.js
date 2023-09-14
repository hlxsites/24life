import {
  buildBlock, decorateBlock, decorateButtons, decorateIcons, getMetadata, toClassName,
} from '../../scripts/lib-franklin.js';

export default async function decorate(doc) {
  // remove title and image from doc
  doc.querySelector('main .section h1').remove();
  doc.querySelector('main .section img').remove();

  if (getMetadata('section')) {
    doc.querySelector('main').classList.add(`color-${toClassName(getMetadata('section'))}`);
  }

  const firstSection = doc.querySelector('main .section');
  const videoHero = firstSection.querySelector('.block.article-hero-video');
  if (!videoHero) {
    firstSection.before(createSectionWithHeroBlock());
  }

  const firstContent = doc.querySelector('main .section .default-content-wrapper');
  firstContent.before(createSocialMediaButtons());

  const newSection = createNewSection();
  newSection.classList.add('article-author-container');
  const newSectionWrapper = document.createElement('div');
  newSectionWrapper.classList.add('default-content-wrapper');
  newSection.append(newSectionWrapper);
  firstSection.parentElement.append(newSection);

  // add a thin gray line to break this up from the previous section
  const line = document.createElement('hr');
  line.classList.add('article-end-line');
  newSectionWrapper.append(line);

  newSectionWrapper.append(createSocialMediaButtons());
  getMetadata('authors').split(',').forEach((author) => {
    newSectionWrapper.append(createAuthorBlock(author));
  });
  newSectionWrapper.append(createArticleCarousel());

  decorateButtons(doc);
}

function createNewSection() {
  const section = document.createElement('div');
  section.classList.add('section');
  section.dataset.sectionStatus = 'initialized';
  section.style.display = 'none';
  return section;
}

function createSectionWithHeroBlock() {
  const section = createNewSection();
  section.classList.add('article-hero-container');

  const wrapper = document.createElement('div');
  const newBlock = buildBlock(
    'article-hero',
    [
      ['title', getMetadata('og:title')],
      ['image', getMetadata('og:image')],
      ['collections', getMetadata('collections')],
      ['authors', getMetadata('authors')],
    ],
  );
  wrapper.append(newBlock);
  decorateBlock(newBlock);
  section.append(wrapper);
  return section;
}

function createAuthorBlock(author) {
  const container = document.createElement('div');
  const newBlock = buildBlock('article-author', author);
  container.append(newBlock);
  decorateBlock(newBlock);
  return container;
}

function createArticleCarousel() {
  const container = document.createElement('div');
  const carouselTitle = document.createElement('p');
  carouselTitle.classList.add('article-carousel-title');
  carouselTitle.innerHTML = `<strong>${getMetadata('section')}</strong> - more to explore`;

  container.append(carouselTitle);
  const newBlock = buildBlock('article-carousel', [['Section', getMetadata('section')]]);
  container.append(newBlock);
  decorateBlock(newBlock);
  return container;
}

function updateSocialLink(e) {
  e.preventDefault();
  const newUrl = `${e.currentTarget.href}${window.location.href}`;
  const pin = newUrl.includes('pinterest.com');
  let description = '';
  let imageUrl = '';
  if (pin) {
    description = encodeURIComponent((document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''));
    imageUrl = (document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '');
  }
  const parameters = pin ? `&description=${description}&image=${imageUrl}` : '';
  window.open(newUrl + parameters, 'sharer', 'toolbar=0,status=0,width=626,height=436');
}

function createSocialMediaButtons() {
  const socialMediaButtons = document.createElement('div');
  socialMediaButtons.innerHTML = `
  <div class="article-social-media-buttons">
          <a aria-label="share this page on twitter" href="https://twitter.com/share?url=">
              <span class="icon icon-twitter-alt"></span>
          </a>
      
          <a aria-label="share this page on facebook" href="http://www.facebook.com/share.php?u=">
              <span class="icon icon-facebook"></span>
          </a>
      
          <a aria-label="share this page on pinterest" href="http://pinterest.com/pin/create/button/?url=">
              <span class="icon icon-pinterest"></span>
          </a>
  </div>`;
  socialMediaButtons.querySelectorAll('a').forEach((a) => {
    a.onclick = updateSocialLink;
  });
  // noinspection JSIgnoredPromiseFromCall
  decorateIcons(socialMediaButtons);
  return socialMediaButtons;
}
