import { createCardBlock } from '../card/card.js';
import { loadBlock } from '../../scripts/lib-franklin.js';

let newArray = [];
let total = [];

export async function searchResults(params) {
  // fetch results from json files
  const allData = await fetch(`${window.location.origin}/articles.json?sheet=full`);
  console.log(allData);
  const jsonData = await allData.json();
  return jsonData.data.filter((entry) => (
    entry.title
    + entry.content
    + entry.path
    + entry.authors
    + entry.collections
    + entry.section
    + entry.categories
  )
    .toLowerCase()
    .includes(params.toLowerCase()));
}

function totalArray(arrayChunk) {
  newArray = newArray.concat(arrayChunk);
  return newArray;
}

function createLoadMoreButton(numInitialLoadedArticles, finalArray, actualLength, block) {
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  const loadMoreButton = document.createElement('button');
  loadMoreContainer.append(loadMoreButton);
  loadMoreButton.classList.add('article-list-load-more-button');
  loadMoreButton.textContent = 'Load more';
  loadMoreButton.addEventListener('click', async () => {
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
  if (actualLength > newCurrentLength) { block.after(loadMoreContainer); }
}

function createCards(finalArray, block) {
  const numInitialLoadedArticles = 24;
  const actualLength = finalArray.length;
  console.log(actualLength);
  if (actualLength < 25) {
    finalArray.map(async (x, index) => {
      if (index === 0) { block.querySelector('.results-loading-spinner').remove(); }
      const wrapper = document.createElement('div');
      const newBlock = createCardBlock(x, wrapper);
      block.append(wrapper);
      await loadBlock(newBlock);
    });
  } else {
    finalArray.slice(0, numInitialLoadedArticles).map(async (x, index) => {
      if (index === 0) { block.querySelector('.results-loading-spinner').remove(); }
      const wrapper = document.createElement('div');
      const newBlock = createCardBlock(x, wrapper);
      block.append(wrapper);
      await loadBlock(newBlock);
    });
    const currentLength = block.querySelectorAll('.search-results > .card-wrapper').length;
    if (actualLength > currentLength) {
      createLoadMoreButton(numInitialLoadedArticles, finalArray, actualLength, block);
    }
  }
}

function createSet(sumArray, block) {
  console.log(sumArray);
  const uniquePath = new Set();
  const finalArray = sumArray.filter((element) => {
    const isDuplicate = uniquePath.has(element.path);
    if (!isDuplicate) {
      uniquePath.add(element.path);
      return true;
    }
    return false;
  });
  console.log(finalArray);
  createCards(finalArray, block);
}

function calculate(inputArray, block) {
  inputArray.forEach(async (filter, index) => {
    searchResults(filter).then((result) => {
      total = totalArray(result);
      console.log(total);
      if (index === (inputArray.length - 1)) {
        if (total.length === 0) {
          document.querySelector('main .results-loading-spinner').style.display = 'none';
          const sorryDiv = document.createElement('div');
          const sorryPara = document.createElement('p');
          sorryDiv.append(sorryPara);
          sorryPara.textContent = 'Sorry, no results were found, search again ?';
          block.append(sorryDiv);
          sorryDiv.classList.add('no-results');
          const searchFormDiv = document.createElement('div');
          sorryDiv.after(searchFormDiv);
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
        } else {
          createSet(total, block);
        }
      }
    });
  });
}

export default async function decorate(block) {
  block.innerHTML = '';
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  console.log(searchTerm);
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    const elementHeading = block.parentNode.parentNode.parentNode.querySelector('.section.search-page-heading');
    const textNode = document.createElement('h1');
    textNode.textContent = searchTerm;
    elementHeading.append(textNode);
    const spinnerDiv = document.createElement('div');
    spinnerDiv.classList.add('results-loading-spinner');
    block.append(spinnerDiv);
    const inputArray = searchTerm.split(' ');
    if (inputArray.length > 1) inputArray.unshift(searchTerm);
    calculate(inputArray, block);
  }
}
