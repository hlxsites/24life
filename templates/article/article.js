import {
  buildBlock, decorateBlock, decorateIcons, getMetadata,
} from '../../scripts/lib-franklin.js';

export default async function decorate(doc) {
  const firstSection = doc.querySelector('main .section');
  firstSection.before(createSectionWithHeroBlock(
    doc.querySelector('main .section h1'),
    doc.querySelector('main .section img'),
  ));

  const firstContent = doc.querySelector('main .section .default-content-wrapper');
  firstContent.before(createSocialMediaButtons());

  const lastContent = [...doc.querySelectorAll('main .section .default-content-wrapper')].at(-1);
  getMetadata('author').split(',').forEach((author) => {
    lastContent.after(createAuthorBlock(author));
  });
  lastContent.after(createSocialMediaButtons());
}

function createSectionWithHeroBlock(h1, img) {
  const section = document.createElement('div');
  section.classList.add('section', 'article-hero-container');

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

function createAuthorBlock(author) {
  const container = document.createElement('div');
  const newBlock = buildBlock('article-author', author);
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
