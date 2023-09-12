import { createCardBlock } from '../card/card.js';

let newArray = [];
let total = [];
let done = true;

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

function displayNextEntries(iterator, numInitialLoadedArticles, loadMoreContainer, block) {
  console.log(done);
  if (done) { block.querySelector('.results-loading-spinner').remove(); done = false; }
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= numInitialLoadedArticles; i++) {
    if (i === numInitialLoadedArticles) { block.after(loadMoreContainer); }
    const next = iterator.next();
    if (next.done) {
      loadMoreContainer.remove();
    }
    const searchItem = next.value;
    if (!searchItem) break;
    const wrapper = document.createElement('div');
    createCardBlock(searchItem, wrapper);
    block.append(wrapper);
  }
}

function createCards(finalArray, block) {
  console.log(finalArray);
  const numInitialLoadedArticles = 23;
  const iterator = finalArray.values();
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.classList.add('article-load-more-container');
  loadMoreContainer.innerHTML = '<button class="article-list-load-more-button">Load more</button>';
  displayNextEntries(iterator, numInitialLoadedArticles, loadMoreContainer, block);
  loadMoreContainer.addEventListener('click', () => {
    displayNextEntries(iterator, numInitialLoadedArticles, loadMoreContainer, block);
  });
}

function createSet(sumArray, block) {
  const uniquePath = new Set();
  const finalArray = sumArray.filter((element) => {
    const isDuplicate = uniquePath.has(element.path);
    if (!isDuplicate) {
      uniquePath.add(element.path);
      return true;
    }
    return false;
  });
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
          console.log(inputArray);
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
