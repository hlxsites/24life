import { createCardBlock } from '../card/card.js';
import { loadBlock, toClassName } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  block.innerHTML = '';
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    const elementHeading = block.parentNode.parentNode.parentNode.querySelector('.section.search-page-heading');
    const textNode = document.createElement('h1');
    textNode.textContent = searchTerm;
    elementHeading.append(textNode);
    const spinnerDiv = document.createElement('div');
    spinnerDiv.classList.add('results-loading-spinner');
    block.append(spinnerDiv);
    const tokenizedSearchWords = searchItems(searchTerm);
    // noinspection ES6MissingAwait
    loadResults(tokenizedSearchWords, block);
  } else {
    window.location.href = '/';
  }
}

function searchItems(searchTerm) {
  const tokenizedSearchWords = searchTerm.split(' ');
  if (tokenizedSearchWords.length > 1) tokenizedSearchWords.unshift(searchTerm);
  return tokenizedSearchWords;
}

async function loadResults(tokenizedSearchWords, resultsDiv) {
  const allData = await fetch(`${window.location.origin}/articles.json?sheet=full`);
  const jsonData = await allData.json();
  const matches = filterMatches(tokenizedSearchWords, jsonData);
  resultsDiv.parentNode.querySelector('.results-loading-spinner').remove();
  if (matches.length === 0) {
    noResults(resultsDiv);
  } else {
    createCards(matches, resultsDiv);
  }
}

function filterMatches(tokenizedSearchWords, jsonData) {
  const allMatches = [];
  tokenizedSearchWords.forEach((searchTerm) => {
    const matches = jsonData.data.filter((entry) => (
      entry.title
      + entry.content
      + entry.path
      + entry.authors
      + entry.collections
      + entry.section
      + entry.categories
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase()));
    allMatches.push(...matches);
  });
  return uniqueMatches(allMatches);
}

function uniqueMatches(allData) {
  const uniquePath = new Set();
  return allData.filter((element) => {
    const isDuplicate = uniquePath.has(element.path);
    if (!isDuplicate) {
      uniquePath.add(element.path);
      return true;
    }
    return false;
  });
}

function noResults(resultsDiv) {
  const sorryDiv = document.createElement('div');
  sorryDiv.innerHTML = '<p>Sorry, no results were found, search again ?<p>';
  resultsDiv.append(sorryDiv);
  sorryDiv.classList.add('no-results');
  const searchFormDiv = document.createElement('div');
  sorryDiv.append(searchFormDiv);
  searchFormDiv.innerHTML = `
   <div class="search-container">
    <div class="search-wrapper">
     <div class='search-form'>
      <form action='/search' method='get'>
        <input type='search' name='q' class='search-input' placeholder="TYPE HERE"/>
      </form>
     </div>
    </div>
   </div>
 `;
  resultsDiv.parentNode.querySelector('.block.search-results.card-container.three-columns .results-div').classList.add('no-results-div');
}
// eslint-disable-next-line
 function displayNextEntries(iterator, loadMoreContainer, resultsDiv) {
  const numInitialLoadedArticles = 23;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= numInitialLoadedArticles; i++) {
    if (i === numInitialLoadedArticles) { resultsDiv.after(loadMoreContainer); }
    const next = iterator.next();
    if (next.done) {
      loadMoreContainer.remove();
    }
    const searchItem = next.value;
    if (!searchItem) break;
    const wrapper = document.createElement('div');
    const newBlock = createCardBlock(searchItem, wrapper);
    if (searchItem.section) {
      newBlock.classList.add(toClassName(searchItem.section));
    }
    resultsDiv.append(wrapper);
    // eslint-disable-next-line
    loadBlock(newBlock);
  }
}

function createCards(finalArray, resultsDiv) {
  const iterator = finalArray.values();
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  loadMoreContainer.innerHTML = '<button class="article-list-load-more-button">Load more</button>';
  displayNextEntries(iterator, loadMoreContainer, resultsDiv);
  loadMoreContainer.querySelector('button').addEventListener('click', () => {
    displayNextEntries(iterator, loadMoreContainer, resultsDiv);
  });
}
