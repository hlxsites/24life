import {
  createOptimizedPicture,
  getMetadata,
  readBlockConfig,
} from '../../scripts/lib-franklin.js';

/**
 * Magazine block that pulls the 4 pillars links to make a footer.
 * @param block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  config.isSubNav = block.classList.contains('navigation');
  config.labels = block.querySelectorAll('div > div:nth-child(2) > p:first-child');
  config.links = [...block.querySelectorAll('div > div:nth-child(2) > p:not(:first-child) > a')];
  block.innerText = '';
  const columns = ['col1', 'col2', 'col3'];
  // create the 3 columns
  columns.forEach((className) => {
    const col = document.createElement('div');
    col.classList.add(className);
    block.append(col);
  });
  const col1 = block.querySelector('div:first-child');
  col1.append(createCoverColumn(config));
  const col2 = block.querySelector('div:nth-child(2)');
  col2.append(createListColumn(config, 0));
  col2.append(createListColumn(config, 1));
  const col3 = block.querySelector('div:nth-child(3)');
  col3.append(createListColumn(config, 2));
  col3.append(createListColumn(config, 3));
  if (config.isSubNav) {
    const pastIssuesLink = document.createElement('a');
    pastIssuesLink.href = '/magazine';
    pastIssuesLink.textContent = "View Past Issues";
    pastIssuesLink.className = 'button';
    col3.append(pastIssuesLink);
  }
}

function createCoverColumn(config) {
  const textCol = new DocumentFragment();
  const titleH4 = document.createElement('h4');
  const titleH6 = document.createElement('h6');
  titleH6.classList.add('red');
  if (!config.isSubNav) {
    const title = getMetadata('og:title').toUpperCase();
    titleH4.textContent = `In This Issue - ${title}`;
    titleH6.textContent = new URL(document.location).pathname.split('/').pop().replaceAll(/-/g, ' ').toUpperCase();
    textCol.append(titleH4);
    textCol.append(titleH6);
    const coverImage = createOptimizedPicture(getMetadata('og:image'), title, false, [{ width: '300' }]);
    textCol.append(coverImage);
  } else {
    const coverImage = createOptimizedPicture(config.image, config.title, false, [{ width: '300' }]);
    titleH4.textContent = config.title;
    titleH6.textContent = config.link.split('/').pop().replaceAll(/-/g, ' ').toUpperCase();
    const thisIssueLink = document.createElement('a');
    thisIssueLink.href = config.link;
    thisIssueLink.textContent = "Explore This Issue";
    thisIssueLink.className = 'button';
    textCol.append(coverImage); 
    textCol.append(titleH6); 
    textCol.append(titleH4);
    textCol.append(thisIssueLink);
  }
  return textCol;
}

function createListColumn(config, index) {
  let section = Object.keys(config)[index];
  let links;
  const newColumn = new DocumentFragment();
  const sectionTitle = document.createElement('div');
  sectionTitle.classList.add('section-title', `${section}`);
  sectionTitle.style.setProperty('color', `var(--color-${section}-text)`);
  if (!config.isSubNav) {
    sectionTitle.textContent = config[section];
    links = document.querySelectorAll(`.card-container .card-wrapper .card.${section} h2 > a`);
  } else {
    sectionTitle.textContent = config.labels[index].innerText;
    links = config.links.slice(index * 3, index * 3 + 3);
  }
  newColumn.append(sectionTitle);
  links.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.innerText = link.innerText;
    newColumn.append(anchor);
  });
  return newColumn;
}
