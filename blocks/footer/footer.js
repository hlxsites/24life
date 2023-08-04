import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

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

    const slogan = footerContainer.querySelector('div:nth-child(2) > p:nth-child(1)');
    slogan.classList.add('footer-slogan');

    footerContainer.querySelectorAll('ul')
      .forEach((list, index) => {
        list.classList.add(`footer-menu-list-${index}`);
      });

    // add horizontal line
    const list = footerContainer.querySelector('ul');
    const horizontalLine = document.createElement('hr');
    list.after(horizontalLine);

    const rightSide = footerContainer.querySelector('div:nth-child(3)');
    // add target="_blank" to all links in right side
    rightSide.querySelectorAll('a').forEach((link) => {
      link.target = '_blank';
    });
    rightSide.classList.add('right-side');

    // Create link for powered by fitness logo
    const poweredByFitnessImg = rightSide.querySelector('p:nth-last-child(2)');
    const poweredByFitnessImgLink = createImageLink(poweredByFitnessImg, 'https://www.24hourfitness.com/');

    // Create link for try workout logo
    const tryWorkoutImg = rightSide.querySelector('p:last-child');
    const tryWorkoutImgLink = createImageLink(tryWorkoutImg, 'https://www.24hourfitness.com/programs/24go/');

    rightSide.append(poweredByFitnessImgLink);
    rightSide.append(tryWorkoutImgLink);

    const leftSide = footerContainer.querySelector('div:first-child');
    leftSide.classList.add('left-side');

    // Create link for Brand logo
    const brandImg = leftSide.querySelector('picture');
    const brandImgLink = createImageLink(brandImg, '/');
    leftSide.append(brandImgLink);

    const middleDiv = footerContainer.querySelector('div:nth-child(2)');
    middleDiv.classList.add('middle-div');

    // Trademark
    const trademarkContainer = document.createElement('div');
    trademarkContainer.classList.add('trademark-container');
    const trademark = middleDiv.querySelector('p:last-child');
    trademark.classList.add('trade-mark');
    trademarkContainer.append(trademark);
    middleDiv.append(trademarkContainer);

    // Top button
    const topBtnContainer = document.createElement('div');
    topBtnContainer.classList.add('button-container', 'jump-to-top-container');
    const topBtn = document.createElement('a');
    topBtn.href = '#top';
    topBtn.className = 'button primary jump-to-top';
    topBtn.textContent = 'Top';
    topBtnContainer.append(topBtn);
    middleDiv.appendChild(topBtnContainer);

    decorateIcons(footerContainer);
    block.append(footerContainer);
  }
}
