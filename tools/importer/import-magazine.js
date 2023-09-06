/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax, no-unused-vars */

import { DOMUtils } from 'helix-import-ui/modules/importer';

export default {
  preprocess: ({
    document, url, html, params,
  }) => {
    params.ldJSON = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  },

  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transform: async ({
    document, url, html, params,
  }) => {
    console.log(' starting transform magazine');
    const main = document.body;

    // use helper method to remove header, footer, etc.
    // WebImporter.DOMUtils.remove(main, [
    //   'header',
    //   'footer',
    //   'noscript',
    //   '.nav-container',
    //   '.breadcrumb',
    //   '.tfl-related-posts-box-wrappper',
    //   '.tfl-author-image',
    //   '#disqus_thread',
    //   'blockquote.wp-embedded-content',
    // ]);

    createMetadata(main, document, params);
    console.log('metadata created');
    createMagazineHero(main, document, params);

    const filename = new URL(url).pathname
      .replace(/\/$/, '')
      // eslint-disable-next-line prefer-regex-literals
      .replace(new RegExp('^/'), '');

    const newPath = `/magazine/${filename}`;
    return {
      element: main,
      path: newPath,
      report: {
        previewUrl: `https://main--24life--hlxsites.hlx.page${newPath}`,
      },
    };
  },
};

export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;
  const meta = {};
  meta.Title = document.querySelector('title').textContent.replace(/-\s*24Life/gm, '');
  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'WebPage')?.datePublished.replace(/T.*$/, '');
  meta.Image = document.querySelector('body > div.main-container > section > div > div > div > div > div > div > section > div > div > div:nth-child(1) > div > div > div.wpb_single_image.wpb_content_element.vc_align_center > figure > a > img');
  const block = generateBlock(document, meta, 'Metadata');
  main.prepend(block);
  return meta;
};

const createMagazineHero = (main, document, params) => {
  const magazineHero = {};

  const layers = document.querySelectorAll('.rs-layer-static.rs-layer');
  magazineHero.Issue = layers[layers.length - 3];
  magazineHero.Title = layers[layers.length - 2].textContent;
  magazineHero.Description = layers[layers.length - 1].textContent;
  // let images = '';
  // const elements = document.querySelectorAll('rs-slide rs-sbg-px rs-sbg-wrap rs-sbg');
  // elements.forEach((element) => {
  //   images += element.outerHTML;
  // });
  // magazineHero.Image = images;

  main.prepend(generateBlock(document, magazineHero, 'magazine-hero'));
};

function generateBlock(document, metadata, blockName) {
  const table = document.createElement('table');

  let row = document.createElement('tr');
  table.append(row);

  const hCell = document.createElement('th');
  row.append(hCell);

  hCell.innerHTML = blockName;
  hCell.setAttribute('colspan', 2);

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const key in metadata) {
    row = document.createElement('tr');
    table.append(row);
    const keyCell = document.createElement('td');
    row.append(keyCell);
    keyCell.textContent = key;
    const valueCell = document.createElement('td');
    row.append(valueCell);
    const value = metadata[key];
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          const p = document.createElement('p');
          p.innerHTML = v;
          valueCell.append(p);
        });
      } else if (typeof value === 'string') {
        valueCell.textContent = value;
      } else {
        valueCell.append(value);
      }
    }
  }
  return table;
}
