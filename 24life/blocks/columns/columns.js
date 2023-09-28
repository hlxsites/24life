import { decorateLinkedPictures } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
  if (block.classList.contains('collections')) {
    columnCollectionsBlock(block);
  }

  if (block.classList.contains('old-magazine-header')) {
    oldMagazineHeader(block);
  }
  decorateLinkedPictures(block);
}

function columnCollectionsBlock(block) {
  block.parentElement.classList.add('column-collections-parent');
  for (const row of block.children) {
    for (const cell of row.children) {
      if (cell.children.length !== 0) {
        const link = cell.querySelector('a');
        const image = cell.querySelector('picture');
        const h2 = document.createElement('h2');
        h2.classList.add('columns-img-header');
        h2.textContent = link.textContent;
        link.textContent = '';
        link.className = 'columns-collections-img-link';
        link.append(h2);
        link.append(image);

        cell.innerHTML = '';
        cell.append(link);
      }
    }
  }
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
  socialMediaButtons.classList.add('old-magazine-social-media-buttons');
  socialMediaButtons.innerHTML = `
          <a aria-label="share this page on twitter" href="https://twitter.com/share?url=">
              <span class="icon icon-twitter-alt"></span>
          </a>

          <a aria-label="share this page on facebook" href="http://www.facebook.com/share.php?u=">
              <span class="icon icon-facebook"></span>
          </a>

          <a aria-label="share this page on pinterest" href="http://pinterest.com/pin/create/button/?url=">
              <span class="icon icon-pinterest"></span>
          </a> `;
  socialMediaButtons.querySelectorAll('a').forEach((a) => {
    a.onclick = updateSocialLink;
  });
  // noinspection JSIgnoredPromiseFromCall
  decorateIcons(socialMediaButtons);
  return socialMediaButtons;
}

function oldMagazineHeader(block) {
  const imageDiv = block.querySelector('.columns-img-col');
  imageDiv.nextElementSibling.classList.add('header-content');

  imageDiv.append(createSocialMediaButtons());
  block.closest('.columns-wrapper').classList.add('old-magazine-header-wrapper');

  const headerContent = block.querySelector('.columns.old-magazine-header.block .header-content');
  const magazineIssue = headerContent.querySelector('h5');
  magazineIssue.classList.add('magazine-issue');

  const magazineTitle = block.querySelector('h1');
  magazineTitle.classList.add('magazine-title');

  const magazineDesc = block.querySelector('h4');
  magazineDesc.classList.add('magazine-desc');

  const quote = block.querySelector('p');
  quote?.classList.add('quote');
  quote?.nextElementSibling?.classList.add('quote-signature');
}
