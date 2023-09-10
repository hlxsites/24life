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

function createCards(finalArray, block) {
  finalArray.map(async (x) => {
    const wrapper = document.createElement('div');
    const newBlock = createCardBlock(x, wrapper);
    block.append(wrapper);
    await loadBlock(newBlock);
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
  console.log(finalArray);
  createCards(finalArray, block);
}

export default async function decorate(block) {
  block.innerHTML = '';
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  console.log(searchTerm);
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    document.querySelector('.section.search-page-heading').innerHTML = `<h1>${searchTerm}</h1>`;
    const inputArray = searchTerm.split(' ');
    if (inputArray.length > 1) inputArray.unshift(searchTerm);
    console.log(inputArray);
    inputArray.forEach(async (filter, index) => {
      searchResults(filter).then((result) => {
        total = totalArray(result);
        console.log(total);
        if (index === (inputArray.length - 1)) {
          createSet(total, block);
        }
      });
    });
  }
}
