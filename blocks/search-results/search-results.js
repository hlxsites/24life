import {
    getMetadata,
    loadBlock, readBlockConfig, toClassName,
  } from '../../scripts/lib-franklin.js';
  import { ffetcharticles } from '../../scripts/ffetch.js';
  import { createCardBlock } from '../card/card.js';
  import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
  import {
    a, h1, div, h2, h3, h4, h5, img, p, span,
  } from '../../scripts/dom-helpers.js';

  export default async function decorate(block) {
    const params = getSearchParams();
  
    block.innerHTML = '';
    if (params.searchTerm) {
      block.prepend(h1(`${params.searchTerm}`));
    }
  }
  
  

  function getSearchParams() {
    /**
     * @type {string}
     */
    const searchTerm = new URLSearchParams(window.location.search).get('q');
  
    return {
      searchTerm
    };
  }

