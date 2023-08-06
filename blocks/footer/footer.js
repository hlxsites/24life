import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // Create container for footer
    const footerContainer = document.createElement('div');
    footerContainer.classList.add('footer-container');
    footerContainer.innerHTML = html;

    const row1 = footerContainer.querySelector('div:nth-child(1)');
    row1.classList.add('row-1');

    const row2 = footerContainer.querySelector('div:nth-child(2)');
    row2.classList.add('row-2');

    // Create link for Brand logo
    const brandImgContainer = document.createElement('div');
    brandImgContainer.classList.add('brand-img-container');
    const brandImg = row1.querySelector('p:nth-child(1)');
    const brandImgLink = createImageLink(brandImg, '/');
    brandImgContainer.append(brandImgLink);
    row1.prepend(brandImgContainer);

    // row1 slogan and lists container
    const row1MiddleContainer = document.createElement('div');
    row1MiddleContainer.classList.add('row-1-middle-container');
    const slogan = row1.querySelector('p:nth-child(2)');
    slogan.classList.add('footer-slogan');
    row1MiddleContainer.append(slogan);
    row1.querySelectorAll('ul').forEach((list) => {
      row1MiddleContainer.append(list);
    });
    row1.querySelector('.brand-img-container').after(row1MiddleContainer);

    // Create container for social icon tags
    const socialIconsContainer = document.createElement('div');
    socialIconsContainer.classList.add('social-icons-container');
    socialIconsContainer.prepend(footerContainer.querySelector('.row-1 > p:nth-last-child(1)'));
    socialIconsContainer.prepend(row1.querySelector(':scope > p:nth-last-child(1)'));
    socialIconsContainer.prepend(row1.querySelector(':scope > p:nth-last-child(1)'));
    socialIconsContainer.prepend(row1.querySelector(':scope > p:nth-last-child(1)'));
    row1.append(socialIconsContainer);

    // add class to each list
    row1.querySelectorAll('ul')
      .forEach((list, index) => {
        list.classList.add(`footer-menu-list-${index + 1}`);
      });

    // add horizontal line
    const list = row1.querySelector('ul');
    const horizontalLine = document.createElement('hr');
    list.after(horizontalLine);

    // add target="_blank" to all links in row1
    row1.querySelectorAll('a').forEach((link) => {
      link.target = '_blank';
    });

    const fitnessAppLinksContainer = document.createElement('div');
    fitnessAppLinksContainer.classList.add('fitness-app-links-container');

    // Create link for powered-by-fitness logo
    const poweredByFitnessImg = row2.querySelector('p:nth-last-child(2)');
    const poweredByFitnessImgLink = createImageLink(poweredByFitnessImg, 'https://www.24hourfitness.com/');

    // Create link for try-workout logo
    const tryWorkoutImg = row2.querySelector('p:last-child');
    const tryWorkoutImgLink = createImageLink(tryWorkoutImg, 'https://www.24hourfitness.com/programs/24go/');

    fitnessAppLinksContainer.append(poweredByFitnessImgLink);
    fitnessAppLinksContainer.append(tryWorkoutImgLink);
    row2.append(fitnessAppLinksContainer);

    // Trademark
    const trademarkContainer = document.createElement('div');
    trademarkContainer.classList.add('trademark-container');
    const trademark = row2.querySelector('p:first-child');
    trademark.classList.add('trade-mark');
    trademarkContainer.append(trademark);
    row2.prepend(trademarkContainer);

    // Top button
    const topBtnContainer = document.createElement('div');
    topBtnContainer.classList.add('button-container', 'jump-to-top-container');
    const topBtn = document.createElement('a');
    topBtn.href = '#top';
    topBtn.className = 'button primary jump-to-top';
    topBtn.textContent = 'Top';
    topBtnContainer.append(topBtn);

    decorateIcons(footerContainer);
    block.append(footerContainer);
    block.append(topBtnContainer);
  }
}

/**
 * Creates an anchor element with the given image as its child
 * @param img
 * @param {string} link
 * @returns {HTMLAnchorElement} anchor
 */
function createImageLink(img, link) {
  const anchor = document.createElement('a');
  anchor.href = link;
  anchor.target = '_blank';
  anchor.appendChild(img);
  return anchor;
}
