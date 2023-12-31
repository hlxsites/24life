import {
  createOptimizedPicture, decorateIcons, getMetadata, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  const picture = block.querySelector('picture');
  const link = block.querySelector('a');
  block.innerText = '';

  // Section Hero
  const section = getMetadata('section');
  const title = data?.title.trim();
  const description = data?.description.trim();
  const authors = data?.authors.trim();

  if (section.toLowerCase() === 'focus' || section.toLowerCase() === 'fitness') {
    block.classList.add('dark-text');
  }

  // create left container
  const leftContainer = document.createElement('div');
  leftContainer.classList.add('left-container');
  // create image container
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');
  // create image
  imageContainer.append(createOptimizedPicture(
    data.image,
    data.article,
    true,
    undefined,
    picture,
  ));
  leftContainer.append(imageContainer);

  // create article container
  const articleContainer = document.createElement('div');
  articleContainer.classList.add('article-container');
  // create h3
  const h3 = document.createElement('h3');
  h3.classList.add('article');
  h3.append(link);
  articleContainer.append(h3);

  // create p element for author
  const authorContainer = document.createElement('p');
  authorContainer.classList.add('author');
  authorContainer.append(createAuthorLink(authors));
  articleContainer.append(authorContainer);
  leftContainer.append(articleContainer);

  // create right container
  const rightContainer = document.createElement('div');
  rightContainer.classList.add('right-container');

  // create wrapper for section name, title, and description
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper');
  const h1 = document.createElement('h1');
  h1.classList.add('section-name');
  h1.append(section);
  wrapper.append(h1);

  // title
  const p = document.createElement('p');
  p.classList.add('title');
  p.append(title);
  wrapper.append(p);

  // description
  const p2 = document.createElement('p');
  p2.classList.add('description');
  p2.append(description);
  wrapper.append(p2);

  // social media buttons
  wrapper.append(createSocialMediaButtons());
  rightContainer.append(wrapper);

  block.append(leftContainer);
  block.append(rightContainer);
}

function createAuthorLink(authors) {
  const authorLinks = document.createElement('span');
  authorLinks.append('By ');
  authors.split(',').forEach((author, index) => {
    const authorLink = document.createElement('a');
    authorLink.href = `${window.hlx.codeBasePath}/author/${toClassName(author)}`;
    authorLink.textContent = author;
    if (index > 0) {
      authorLinks.append(' and ');
    }
    authorLinks.append(authorLink);
  });
  return authorLinks;
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
  socialMediaButtons.classList.add('social-media-buttons');
  // delay loading of social media buttons to give priority to loading other things
  setTimeout(() => {
    socialMediaButtons.innerHTML = `
          <a aria-label="share this page on twitter" href="https://twitter.com/share?url=">
              <span class="icon icon-twitter"></span>
          </a>

          <a aria-label="share this page on facebook" href="http://www.facebook.com/share.php?u=">
              <span class="icon icon-facebook"></span>
          </a>

          <a aria-label="share this page on pinterest" href="http://pinterest.com/pin/create/button/?url=">
              <span class="icon icon-pinterest"></span>
          </a>`;
    socialMediaButtons.querySelectorAll('a').forEach((a) => {
      a.onclick = updateSocialLink;
    });

    // noinspection JSIgnoredPromiseFromCall
    decorateIcons(socialMediaButtons);
  }, 300);

  return socialMediaButtons;
}
