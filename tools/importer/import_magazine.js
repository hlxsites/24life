/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax, no-unused-vars */

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
  console.log('meta.Image:', meta.Image);
  const block = generateBlock(document, meta, 'Metadata');
  main.prepend(block);
  return meta;
};

const createMagazineHero = async (main, document, params) => {
  const magazineHero = {};

  const layers = document.querySelectorAll('.rs-layer-static.rs-layer');
  magazineHero.Issue = layers[layers.length - 3];
  magazineHero.Title = layers[layers.length - 2].textContent;
  magazineHero.Description = layers[layers.length - 1].textContent;

  const pillars = document.querySelectorAll('.tp-selecttoggle.rs-layer-static.rs-layer.rs-waction');
  magazineHero.Focus = pillars[0].innerHTML
    + link(pillars[0].innerHTML, extractURL(pillars[0].outerHTML));
  magazineHero.Fitness = pillars[1].innerHTML
    + link(pillars[1].innerHTML, extractURL(pillars[1].outerHTML));
  magazineHero.Fuel = pillars[2].innerHTML
    + link(pillars[2].innerHTML, extractURL(pillars[2].outerHTML));
  magazineHero.Recover = pillars[3].innerHTML
    + link(pillars[3].innerHTML, extractURL(pillars[3].outerHTML));

  magazineHero.Image = [];
  const elements = document.querySelectorAll('rs-slide rs-sbg-px rs-sbg-wrap rs-sbg');
  elements.forEach((element) => {
    magazineHero.Image.push(createImg(element.outerHTML));
    magazineHero.Image.push();
  });

  main.prepend(generateBlock(document, magazineHero, 'magazine-hero'));
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
