/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax, no-unused-vars */

function createQuoteBlock(main, document) {
  const quote = document.querySelector('.wpb_text_column.wpb_content_element .wpb_wrapper p.text-style-title-2').textContent;
  let author = document.querySelector('.wpb_text_column.wpb_content_element .wpb_wrapper p.text-style-body-2').textContent;
  // remove leading non word characters so – Rhonda Byrne becomes Rhonda Byrne
  author = author.replace(/^\W+/, '');

  main.append(generateBlock(document, { Text: quote, Author: author }, 'Quote'));
  main.innerHTML += '<p> --- </p>';
}

function createYoutubeLink(document, main) {
  const youtubeLink = document.querySelector('.embed-video-container iframe.embed-responsive-item').src;
  main.append(youtubeLink);
  main.innerHTML += `${youtubeLink} <p> --- </p>`;
}

function createSingleCardBlock(main, document) {


  const content = [];
  const card = document.createElement('div'); 
  card.append(document.querySelector('.vc_col-sm-12.vc_gitem-col.vc_gitem-col-align-.mindset img'));
  
  // Get Started
  const getStarted = document.querySelector('.vc_col-sm-12.tfl-post-grid-col.vc_gitem-col.vc_gitem-col-align-.mindset .tfl-tags a:first-child').textContent.toUpperCase();
  const successStories = document.querySelector('.vc_col-sm-12.tfl-post-grid-col.vc_gitem-col.vc_gitem-col-align-.mindset .tfl-tags a:last-child').textContent.toUpperCase();
  card.append(document.createTextNode(`${getStarted}, ${successStories}`));

  card.innerHTML += '<br/>';
  
  // article link
  card.append(document.querySelector('.vc_custom_heading.tfl-post-grid-title.vc_gitem-post-data.vc_gitem-post-data-source-post_title a'));

  card.innerHTML += '<br/>';

  // author 
  const author = document.querySelector('.vc_grid-container.vc_clearfix.wpb_content_element.vc_basic_grid .mindset .tfl-post-grid-author a').textContent;
  card.append(document.createTextNode(`By: ${author}`));
  content.push(card);
  main.append(WebImporter.DOMUtils.createTable([['Card (Focus, Large)'], content], document));
}

export default {
  preprocess: ({
    document, url, html, params,
  }) => {
    params.ldJSON = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  },

  transform: async ({
    document, url, html, params,
  }) => {
    console.log(' starting transform magazine');
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'noscript',
      '.nav-container',
      '.breadcrumb',
      '.tfl-related-posts-box-wrappper',
      '.tfl-author-image',
      '#disqus_thread',
      'blockquote.wp-embedded-content',
    ]);

    createMetadata(main, document, params);
    console.log('metadata created');

    await createMagazineHero(main, document, params);
    console.log('MagazineHero created');

    createYoutubeLink(document, main);
    console.log('youtubeLink created');

    createQuoteBlock(main, document);
    console.log('Quote created');

    createSingleCardBlock(main, document);
    console.log('SingleCard created');


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
  main.append(block);
  return meta;
};

const createMagazineHero = async (main, document, params) => {
  const magazineHero = {};

  const layers = document.querySelectorAll('.rs-layer-static.rs-layer');
  magazineHero.Issue = layers[layers.length - 3];
  magazineHero.Title = layers[layers.length - 2].textContent;
  magazineHero.Description = layers[layers.length - 1].textContent;
  await waitForElement('.tp-selecttoggle.rs-layer-static.rs-layer.rs-waction', document);
  const pillars = document.querySelectorAll('.tp-selecttoggle.rs-layer-static.rs-layer.rs-waction');
  magazineHero.Focus = pillars[0].textContent
    + link(pillars[0].innerHTML, extractURL(pillars[0].outerHTML));
  magazineHero.Fitness = pillars[1].textContent
    + link(pillars[1].innerHTML, extractURL(pillars[1].outerHTML));
  magazineHero.Fuel = pillars[2].textContent
    + link(pillars[2].innerHTML, extractURL(pillars[2].outerHTML));
  magazineHero.Recover = pillars[3].textContent
    + link(pillars[3].innerHTML, extractURL(pillars[3].outerHTML));

  magazineHero.Image = [];
  const elements = document.querySelectorAll('rs-slide rs-sbg-px rs-sbg-wrap rs-sbg');
  elements.forEach((element) => {
    magazineHero.Image.push(createImg(element.outerHTML));
    magazineHero.Image.push();
  });

  main.append(generateBlock(document, magazineHero, 'magazine-hero'));
};

function link(text, url) {
  const article = document.createElement('a');
  article.setAttribute('href', url);
  article.textContent = text;
  return article;
}

function extractURL(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const elem = doc.querySelector('rs-layer');
  if (elem) {
    const match = elem.getAttribute('data-actions').match(/url:([^;]*)/);
    return match ? match[1].trim() : null;
  }
  return null;
}

function createImg(outerHTML) {
  const src = new DOMParser().parseFromString(outerHTML, 'text/html').body.firstChild.getAttribute('src');
  const img = document.createElement('img');
  img.title = 'magazine-hero-image';
  if (src) {
    img.setAttribute('src', src);
    img.src = src;
  }
  return img;
}

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
        valueCell.innerHTML = value.map((v) => v.outerHTML).join('<br>');
      } else if (typeof value === 'string') {
        valueCell.textContent = value;
      } else {
        valueCell.append(value);
      }
    }
  }
  return table;
}

async function waitForElement(selector, document, timeout = 5000, interval = 250) {
  return new Promise((resolve, reject) => {
    const timeWas = new Date();
    const wait = setInterval(() => {
      if (document.querySelectorAll(selector)) {
        clearInterval(wait);
        resolve();
      } else if (new Date() - timeWas > timeout) { // Timeout
        clearInterval(wait);
        reject();
      }
    }, interval);
  });
}
