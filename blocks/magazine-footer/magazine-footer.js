import { createOptimizedPicture, decorateIcons, getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';

/**
 * Magazine block that pulls the 4 pillars links to make a footer.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerText = '';
  const columns = ['col1', 'col2', 'col3'];
  // create the 3 columns
  columns.forEach( (className) => {
    const col = document.createElement('div');
    col.classList.add(className);
    block.append(col);
  });
  const col1 = block.querySelector('div:first-child');
  col1.append(createCoverColumn());
  const col2 = block.querySelector('div:nth-child(2)');
  col2.append(createListColumn(config, 0));
  col2.append(createListColumn(config, 1));
  const col3 = block.querySelector('div:nth-child(3)');
  col3.append(createListColumn(config, 2));
  col3.append(createListColumn(config, 3));
}

function createCoverColumn() {
  const textCol = new DocumentFragment();
  const titleH4 = document.createElement('h4');
  const titleH6 = document.createElement('h6');
  titleH6.classList.add('red');
  const title = getMetadata('og:title').toUpperCase();
  titleH4.textContent = `In This Issue - ${title}`;
  titleH6.textContent = new URL(document.location).pathname.split('/').pop().replaceAll(/-/g,' ').toUpperCase();
  textCol.append(titleH4);
  textCol.append(titleH6);

  const coverImage = createOptimizedPicture(getMetadata('og:image'), title, false, [{ width: '300' }]);
  textCol.append(coverImage);
  return textCol;
}

function createListColumn(config, section) {
  const obj = Object.keys(config)[section]
  const newColumn = new DocumentFragment();
  const sectionTitle = document.createElement('div');
  sectionTitle.classList.add('section-title',`${obj}`);
  sectionTitle.textContent = config[obj];
  sectionTitle.style.setProperty('color', `var(--color-${obj}-text)`);
  newColumn.append(sectionTitle);
  const links = document.querySelectorAll(`.card-container .card-wrapper .card.${obj} h2 > a`);
  links.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.innerText = link.innerText;
    newColumn.append(anchor);
  });
  return newColumn;
}
