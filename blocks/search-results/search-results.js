import { createCardBlock } from '../card/card.js';
import { loadBlock, getMetadata } from '../../scripts/lib-franklin.js';

export async function searchResults(params, jsonData) {
  // eslint-disable-next-line
    return jsonData.data.filter((entry) => (entry.title + entry.description + entry.path + entry.authors + entry.collections + entry.section + entry.categories + entry.template).toLowerCase().includes(params.toLowerCase()));
}

export default async function decorate(block) {
  // fetch results from json files
  const allData = await fetch(`${window.location.origin}/query-index.json`);
  console.log(allData);
  const jsonData = await allData.json();
  // for search functionality
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  console.log(searchTerm);
  block.classList.add('card-container', 'three-columns');
  if (searchTerm) {
    const inputArray = searchTerm.split(' ');
    if (inputArray.length > 1) inputArray.unshift(searchTerm);
    console.log(inputArray);
    inputArray.forEach(async (filter) => {
      const results = await searchResults(filter, jsonData);
      console.log(results);
      // const numInitialLoadedArticles = 30;
      console.log(results.length);
      if (results.length > 0) {
        document.querySelector('.section.search-results-container').style.display = 'block';
        await results
          .map(async (x) => {
            const wrapper = document.createElement('div');
            const newBlock = createCardBlock(x, wrapper);
            // if (x.section) {
            //   newBlock.classList.add(toClassName(x.section));
            // }
            block.append(wrapper);
            await loadBlock(newBlock);
          });
      }
    });
  }
  const params = getSearchParams();
  // block.innerHTML = '';
  if (params.searchTerm) {
    document.querySelector('.section.search-page-heading').innerHTML = `<h1>${params.searchTerm}</h1>`;
  }
}

function getSearchParams() {
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  return { searchTerm };
}
