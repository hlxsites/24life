import { loadCSS, loadScript } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  block.innerHTML = '';

  await loadCSS(`${window.hlx.codeBasePath}/pagefind/pagefind-ui.css`);
  await loadScript(`${window.hlx.codeBasePath}/pagefind/pagefind-ui.js`);

  const searchFormDiv = document.createElement('div');
  searchFormDiv.id = 'search-form';
  block.append(searchFormDiv);

  // eslint-disable-next-line no-undef,no-new
  new PagefindUI({ element: '#search-form', showSubResults: true });
}
