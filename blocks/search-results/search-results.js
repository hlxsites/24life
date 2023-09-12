import { createCardBlock } from '../card/card.js';
import { loadBlock } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  block.innerHTML = '';
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    const elementHeading = block.parentNode.parentNode.parentNode.querySelector('.section.search-page-heading');
    const header = document.createElement('h1');
    header.textContent = searchTerm;
    elementHeading.append(header);
    const spinnerDiv = document.createElement('div');
    spinnerDiv.classList.add('results-loading-spinner');
    block.append(spinnerDiv);

    const tokenizedSearchWords = tokenizeSearchTerms(searchTerm);
    // noinspection ES6MissingAwait
    loadResults(tokenizedSearchWords, block);
  }
}

async function loadResults(tokenizedSearchWords, block) {
  const allData = await fetch(`${window.location.origin}/articles.json?sheet=full`);
  const jsonData = await allData.json();

  const uniqueMatches = filterMatches(tokenizedSearchWords, jsonData);

  document.querySelector('main .results-loading-spinner').remove();

  if (uniqueMatches.length === 0) {
    block.append(addNoResultElement());
  } else {
    createCards(uniqueMatches, block);
  }
}

function filterEntry(entry, filter) {
  return (
    entry.title
      + entry.content
      + entry.path
      + entry.authors
      + entry.collections
      + entry.section
      + entry.categories
  )
    .toLowerCase()
    .includes(filter.toLowerCase());
}

function filterMatches(tokenizedSearchWords, jsonData) {
  const matches = [];
  for (const filter of tokenizedSearchWords) {
    matches.push(...(jsonData.data.filter((entry) => filterEntry(entry, filter))));
  }

  return filterDuplicates(matches);
}

function createLoadMoreButton(numInitialLoadedArticles, finalArray, actualLength, block) {
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  loadMoreContainer.innerHTML = '<button class="article-list-load-more-button">Load more</button>';
  loadMoreContainer.addEventListener('click', async () => {
    const currentLength = block.querySelectorAll('.search-results > .card-wrapper').length;
    const counter = currentLength / numInitialLoadedArticles;
    // eslint-disable-next-line
        finalArray.slice(numInitialLoadedArticles * counter, (numInitialLoadedArticles * counter) + numInitialLoadedArticles)
      .map(async (x) => {
        const wrapper = document.createElement('div');
        const newBlock = createCardBlock(x, wrapper);
        block.append(wrapper);
        await loadBlock(newBlock);
      });
    // eslint-disable-next-line
        const newCurrentLength = block.querySelectorAll('.search-results > .card-wrapper').length;
    if ((actualLength - newCurrentLength) < numInitialLoadedArticles) {
      block.parentNode.querySelector('.article-load-more-container').remove();
    }
  });
  const newCurrentLength = block.querySelectorAll('.search-results > .card-wrapper').length;
  if (actualLength > newCurrentLength) {
    block.after(loadMoreContainer);
  }
}

function createCards(matches, block) {
  const numInitialLoadedArticles = 24;
  const actualLength = matches.length;
  matches.slice(0, numInitialLoadedArticles).map(async (x, index) => {
    const wrapper = document.createElement('div');
    const newBlock = createCardBlock(x, wrapper);
    block.append(wrapper);
    await loadBlock(newBlock);
  });
  if (actualLength > numInitialLoadedArticles) {
    createLoadMoreButton(numInitialLoadedArticles, matches, actualLength, block);
  }
}

function filterDuplicates(matches) {
  const uniquePath = new Set();

  return matches.filter((element) => {
    const isDuplicate = uniquePath.has(element.path);
    if (!isDuplicate) {
      uniquePath.add(element.path);
      return true;
    }
    return false;
  });
}

function addNoResultElement() {
  const sorryDiv = document.createElement('div');
  sorryDiv.classList.add('no-results');
  sorryDiv.innerHTML = `
    <div class="no-results">
        <p>Sorry, no results were found, search again ?</p>
    </div>
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
  return sorryDiv;
}

function tokenizeSearchTerms(searchTerm) {
  const tokenizedSearchWords = searchTerm.split(' ');
  if (tokenizedSearchWords.length > 1) tokenizedSearchWords.unshift(searchTerm);
  return tokenizedSearchWords;
}
