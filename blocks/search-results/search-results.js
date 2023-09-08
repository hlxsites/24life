import { getMetadata, loadBlock, readBlockConfig, toClassName,} from '../../scripts/lib-franklin.js';
  import { ffetcharticles } from '../../scripts/ffetch.js';
  import { createCardBlock } from '../card/card.js';
  import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
  import {
    a, h1, div, h2, h3, h4, h5, img, p, span,
  } from '../../scripts/dom-helpers.js';

export async function searchResults(params, jsonData) {
  // eslint-disable-next-line
    return jsonData.data.filter((entry) => (entry.title + entry.description + entry.path + entry.authors + entry.collections + entry.section + entry.categories + entry.template).toLowerCase().includes(params.toLowerCase()));
}

export default async function decorate(block) {
  // fetch results from json files
  const allData = await fetch(`${window.location.origin}/query-index.json`);
  const jsonData = await allData.json();
  // for search functionality
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  console.log(searchTerm);
  if (searchTerm) {
    const inputArray = searchTerm.split(' ');
    if (inputArray.length > 1) inputArray.unshift(searchTerm);
    console.log(inputArray);
    inputArray.forEach(async (filter) => {
      const results = await searchResults(filter, jsonData);
      console.log(results);
    });
  }
  const params = getSearchParams();
  block.innerHTML = '';
  if (params.searchTerm) {
    document.querySelector('.section.search-page-heading').innerHTML = `<h1>${params.searchTerm}</h1>`;
  }
}

function getSearchParams() {
  const searchTerm = new URLSearchParams(window.location.search).get('q');
  return { searchTerm };
}
