import {buildBlock, decorateBlock, decorateIcons} from '../../scripts/lib-franklin.js';

function createHeroBlock() {
  const container = document.createElement('div');
  const postSidebar = buildBlock('article-hero', '');
  container.append(postSidebar);
  decorateBlock(postSidebar);
  return container;
}

function createAuthorBlock() {
  const container = document.createElement('div');
  const postSidebar = buildBlock('article-author', '');
  container.append(postSidebar);
  decorateBlock(postSidebar);
  return container;
}

export default async function decorate(doc) {
  const firstContent = doc.querySelector('main .section .default-content-wrapper');
  firstContent.before(createHeroBlock());
  firstContent.before(createSocialMediaButtons());

  const lastContent = doc.querySelector('main .section:last-child .default-content-wrapper');
  lastContent.after(createAuthorBlock());
  lastContent.after(createSocialMediaButtons());
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
