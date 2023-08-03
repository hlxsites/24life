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

    const slogan = footerContainer.querySelector('div:nth-child(2) > p:nth-child(1)');
    slogan.classList.add('footer-slogan');
    footerContainer.querySelectorAll('ul')
      .forEach((list) => {
        list.classList.add('footer-menu-list');
      });
    const rightSide = document.querySelector('div:nth-child(3)');
    rightSide.classList.add('rightSide');
    decorateIcons(footerContainer);
    block.append(footerContainer);
  }
}
