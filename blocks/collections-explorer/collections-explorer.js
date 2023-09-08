import { decorateLinkedPictures } from '../../scripts/scripts.js';

export default function decorate(block) {
  // When the links on the nested parentContainer are clicked,
  // background image of the parent parentContainer changes.
  const parentContainer = document.createElement('div');
  parentContainer.classList.add('container');
  const linksContainer = document.createElement('div');
  linksContainer.classList.add('links-container');
  parentContainer.append(linksContainer);

  const ul = document.createElement('ul');
  ul.classList.add('links');
  linksContainer.append(ul);

  // Select all links within the block
  const links = block.querySelectorAll('a');
  const linkImageList = [];

  links.forEach((link) => {
    // Find closest common parent (for example, a parentContainer)
    const parent = link.closest('div');

    // Find the image within that parent
    const img = parent ? parent.querySelector('img') : null;

    // Add to the array if an image is found
    if (img) {
      linkImageList.push({
        link: link.cloneNode(true),
        image: img.cloneNode(true),
      });
    }

    // default background image
    if (link.textContent?.toLowerCase().includes('yoga')) {
      parentContainer.style.backgroundImage = `url(${img.src})`;
    }

    // Add event listener for mouseover
    link.addEventListener('mouseover', () => {
      if (img) {
        parentContainer.style.backgroundImage = `url(${img.src})`;
      }
    });

    // append links to ul
    const li = document.createElement('li');
    li.append(link);
    ul.append(li);
  });

  // listen for view port size changes
  const mediaQuery = window.matchMedia('(min-width: 600px)');

  if (mediaQuery.matches) {
    block.innerHTML = '';
    block.append(parentContainer);
  } else {
    block.innerHTML = '';
    block.append(buildMobileView(linkImageList));
    decorateLinkedPictures(block);
  }
  block.parentElement.prepend(buildExploreCollectionsButton());

  // listen for view port size changes, and show mobile view if window width is less than 600px
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) {
      // window width is at least 600px
      block.innerHTML = '';
      block.append(parentContainer);
    } else {
      block.innerHTML = '';
      block.append(buildMobileView(linkImageList));
      decorateLinkedPictures(block);
    }
  });
}

/**
 * Build mobile view
 * @param linkImageList {Array} array of link and image objects
 * @returns {HTMLDivElement} parentDiv
 */
function buildMobileView(linkImageList) {
  const parentDiv = document.createElement('div');
  if (linkImageList.length === 0) return parentDiv;
  linkImageList.forEach((linkImage) => {
    const div = document.createElement('div');
    const { link } = linkImage;
    const { image } = linkImage;
    const h2 = document.createElement('h2');
    h2.classList.add('img-header');
    h2.textContent = link.textContent;
    link.textContent = '';
    link.className = 'img-link';
    link.append(h2);
    link.append(image);
    div.append(link);
    parentDiv.append(div);
  });
  return parentDiv;
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
