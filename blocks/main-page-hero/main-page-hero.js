import {
  createOptimizedPicture, decorateIcons, readBlockConfig, toClassName,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  const link = block.querySelector('a');
  block.innerText = '';

  // change the background color of the block based on the url
  if (window.location.pathname === '/focus') {
    block.style.backgroundColor = '#3cb6ce';
  } else if (window.location.pathname === '/fitness') {
    block.style.backgroundColor = '#ef0d0d';
  } else if (window.location.pathname === '/fuel') {
    block.style.backgroundColor = '#008441';
  } else if (window.location.pathname === '/recover') {
    block.style.backgroundColor = '#44697d';
  }

  const section = data?.section.trim();
  const title = data?.title.trim();
  const description = data?.description.trim();
  const authors = data?.authors.trim();

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
    authorLink.href = `/author/${toClassName(author)}`;
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
  socialMediaButtons.innerHTML = `
  <div class="social-media-buttons">
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
