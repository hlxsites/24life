import {
  loadBlock, toClassName,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { createCardBlock } from '../card/card.js';

export default async function decorate(block) {
  // apply modifiers to the wrapper as well
  const gapCls = [...block.classList].filter((cls) => cls.indexOf('gap') >= 0);
  if (gapCls.length) block.parentElement.classList.add(gapCls);
  // Formats a table and applies background images. Generally, each item should be in a table cell.
  // When a cell is empty, the cells are merged vertically.
  const columns = [...block.firstElementChild.children];

  // cells in each column are moved into the first row as <li>
  block.querySelectorAll(':scope > div').forEach((row, rowIndex) => {
    row.querySelectorAll(':scope > div').forEach((cell, columnIndex) => {
      wrapContentInList(cell);

      // make sure it's not rendered as a button
      cell.querySelector('a')?.classList.remove('button');

      if (rowIndex > 0) {
        // move to first row
        cell.querySelectorAll('li').forEach((li) => {
          if (li.childElementCount) {
            columns[columnIndex].querySelector('ul').append(li);
          }
        });
        cell.remove();
      }
    });
    if (rowIndex > 0) {
      row.remove();
    }
  });
  removeEmptyLi(block);

  const grid = document.createElement('ul');

  const colCount = columns.length;
  // get the max of list items per column, remove empty ones
  const rowCount = columns.map((col) => [...col.querySelectorAll('li')].filter((li) => {
    if (li.innerHTML.trim() === '') li.remove();
    return !!li.parentElement;
  }).length).reduce((l, r) => Math.max(l, r), 0);

  grid.style.setProperty('--grid-row-count', rowCount);
  grid.style.setProperty('--grid-col-count', colCount);

  columns.forEach((column) => {
    const lis = column.querySelectorAll(':scope > ul > li');
    const liCount = lis.length;
    lis.forEach(async (li, i) => {
      const articleURL = new URL(li.innerHTML);
      await fetchArticleAndCreateCard(articleURL.pathname, li);
      // first item spans multiple rows
      if (i === 0 && liCount < rowCount) li.style.setProperty('--grid-row-span', rowCount - liCount + 1);

      grid.append(li);
    });
  });

  block.innerHTML = grid.outerHTML;
}

/**
 * make sure there is an <ul>, move any content into an <li>
 */
function wrapContentInList(cell) {
  const nonListContent = [...cell.childNodes].filter((el) => el.nodeName !== 'UL');

  let ul = cell.querySelector(':scope > ul');
  if (!ul) {
    ul = document.createElement('ul');
    cell.append(ul);
  }

  if (nonListContent.length) {
    const li = document.createElement('li');
    if (cell.dataset.align) li.dataset.align = cell.dataset.align;
    li.append(...nonListContent);
    ul.append(li);
  }
}

function removeEmptyLi(cell) {
  cell.querySelectorAll('li').forEach((li) => {
    if (li.innerHTML.trim() === '') li.remove();
  });
}

async function fetchArticleAndCreateCard(path, li) {
  return ffetch('/articles.json')
    // make sure all filters match
    .filter((article) => article.path?.toLowerCase() === path.toLowerCase())
    .limit(1)
    .map(async (article) => {
      const wrapper = document.createElement('div');
      const card = createCardBlock(article, wrapper);
      if (article.section) {
        card.classList.add(toClassName(article.section));
      }
      li.innerHTML = '';
      li.append(wrapper);
      await loadBlock(card);
    })
    .all();
}
