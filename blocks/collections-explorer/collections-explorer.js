import { toClassName } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  // When the links on the nested parentContainer are clicked,
  // background image of the parent parentContainer changes.

  // collect all links from each cell of the block
  const linkImageList = [];
  for (const cell of block.querySelectorAll(':scope > div > div')) {
    const picture = cell.querySelector('picture');
    const link = cell.querySelector('a');
    if (link && picture) {
      linkImageList.push({
        link,
        picture,
      });
    }
  }

  block.innerHTML = '';
  block.append(buildExploreCollectionsButton());
  block.append(buildDesktopView(linkImageList));
  block.append(buildMobileView(linkImageList));
  // decorateLinkedPictures(block);
}

/**
 * @typedef {Object} PictureLinkPair
 *
 * @property {HTMLAnchorElement} link
 * @property {HTMLPictureElement} picture
 */

/**
 * @param linkImageList {Array<PictureLinkPair>} array of link and image objects
 */
function buildDesktopView(linkImageList) {
  const desktopView = document.createElement('div');
  desktopView.classList.add('container', 'desktop-only');

  const pictures = document.createElement('div');
  pictures.classList.add('pictures');
  desktopView.append(pictures);

  const links = document.createElement('ul');
  links.classList.add('links');
  desktopView.append(links);

  for (let i = 0; i < linkImageList.length; i++) {
    const pair = linkImageList[i];
    const link = pair.link.cloneNode(true);
    const picture = pair.picture.cloneNode(true);

    const li = document.createElement('li');
    li.append(link);
    links.append(li);

    picture.dataset.name = toClassName(link.textContent);
    if (i === 0) {
      picture.classList.add('active');
    }
    pictures.append(picture);

    link.addEventListener('mouseover', (event) => {
      event.preventDefault();
      pictures.querySelector('picture.active').classList.remove('active');
      picture.classList.add('active');
    });
  }

  return desktopView;
}

/**
 * @param linkImageList {Array<PictureLinkPair>} array of link and image objects
 * @returns {HTMLDivElement}
 */
function buildMobileView(linkImageList) {
  const mobileView = document.createElement('div');
  mobileView.className = 'mobile-only';
  if (linkImageList.length === 0) return mobileView;
  for (const pair of linkImageList) {
    const div = document.createElement('div');
    const link = pair.link.cloneNode(true);
    const picture = pair.picture.cloneNode(true);

    const h2 = document.createElement('h2');
    h2.classList.add('img-header');
    h2.textContent = link.textContent;
    link.textContent = '';
    link.className = 'img-link';
    link.append(h2);
    link.append(picture);
    div.append(link);
    mobileView.append(div);
  }
  return mobileView;
}

function buildExploreCollectionsButton() {
  const div = document.createElement('div');
  div.className = 'explore';
  div.innerHTML = `
    <a class="btn" href="/collections">Collections</a>
    <span class="msg">Explore what interests you…</span>
`;
  return div;
}
