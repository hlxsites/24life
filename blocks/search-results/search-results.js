import { createCardBlock } from '../card/card.js';
import { loadBlock } from '../../scripts/lib-franklin.js';

export async function searchResults(params) {
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

export default async function decorate(block) {
  // fetch results from json files
  block.innerHTML = '';
  // const allData = await fetch(`${window.location.origin}/articles.json?sheet=full`);
  // console.log(allData);
  // const jsonData = await allData.json();
  // for search functionality
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  console.log(searchTerm);
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    document.querySelector('.section.search-page-heading').innerHTML = `<h1>${searchTerm}</h1>`;
    const inputArray = searchTerm.split(' ');
    if (inputArray.length > 1) inputArray.unshift(searchTerm);
    console.log(inputArray);
    inputArray.forEach(async (filter) => {
      searchResults(filter).then((result) => {
        console.log(result);
        console.log(result.length);
        document.querySelector('.section.search-results-container').style.display = 'block';
        result.map(async (x) => {
          const wrapper = document.createElement('div');
          const newBlock = createCardBlock(x, wrapper);
          block.append(wrapper);
          loadBlock(newBlock);
        });
      });
    });
  }
}
