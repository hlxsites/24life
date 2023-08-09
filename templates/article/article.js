import { buildBlock, decorateBlock, decorateIcons } from '../../scripts/lib-franklin.js';

export default async function decorate(doc) {
  const firstSection = doc.querySelector('main .section');
  firstSection.before(createSectionWithHeroBlock());

  // remove h1 and picture
  doc.querySelector('main .section .default-content-wrapper h1').remove();
  doc.querySelector('main .section .default-content-wrapper p').remove();
  const firstContent = doc.querySelector('main .section .default-content-wrapper');
  firstContent.before(createSocialMediaButtons());

  const lastContent = doc.querySelector('main .section:last-child');
  lastContent.append(createSocialMediaButtons());
  lastContent.append(createAuthorBlock());
}

function createSectionWithHeroBlock() {
  const section = document.createElement('div');
  section.classList.add('section', 'article-hero-container');

  const container = document.createElement('div');
  const newBlock = buildBlock('article-hero', '');
  container.append(newBlock);
  decorateBlock(newBlock);

  section.append(container);
  return section;
}

function createAuthorBlock() {
  const container = document.createElement('div');
  const newBlock = buildBlock('article-author', '');
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
