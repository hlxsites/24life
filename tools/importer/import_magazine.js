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

    await createMagazineHero(main, document, params);
    console.log('MagazineHero created');

    createYoutubeLink(document, main);
    console.log('youtubeLink created');

    createQuoteBlock(main, document);
    console.log('Quote created');

    createCardBlocks(main, document);
    console.log('SingleCard created');

    createSubscribeForm(main, document);
    console.log('Subscribe form created');

    createMagazineFooter(main, document);
    console.log('Magazine footer created');

    WebImporter.DOMUtils.remove(main, [
      '.mpad.light-wrapper.normal-padding.vc_row.wpb_row.vc_row-fluid.mpad.light-wrapper.normal-padding',
      '.vc_grid-item-mini.vc_clearfix',
      '.image-bg.not-parallax.tfl-constant-contact-wrapper.bg-dark.normal-padding.vc_row.wpb_row.vc_row-fluid.tfl-constant-contact-wrapper.bg-dark.normal-padding',
      '.wpb_text_column.wpb_content_element .wpb_wrapper',
      '.embed-video-container iframe.embed-responsive-item',
      '.tfl-magazine-current-issue-footer',
    ]);
    const filename = new URL(url).pathname
      .replace(/\/$/, '')
      // eslint-disable-next-line prefer-regex-literals
      .replace(/^\//, '');

    const newPath = `/${filename}`;
    return {
      element: main,
      path: newPath,
      report: {
        previewUrl: `https://main--24life--hlxsites.hlx.page${newPath}`,
      },
    };
  },
};

function createQuoteBlock(main, document) {
  let quote = document.querySelector('.wpb_text_column.wpb_content_element .wpb_wrapper p.text-style-title-2').textContent;
  let author = document.querySelector('.wpb_text_column.wpb_content_element .wpb_wrapper p.text-style-body-2').textContent;
  // remove leading non word characters so – Rhonda Byrne becomes Rhonda Byrne
  author = author.replace(/^\W+/, '');
  quote = quote.replace(/“/g, '').replace(/”/g, '');
  const row1 = ['Text', quote];
  const row2 = ['Author', author];
  const rows = [['Quote'], row1, row2];
  main.append(WebImporter.DOMUtils.createTable(rows, document));
  main.innerHTML += '<p> --- </p>';
}

function createYoutubeLink(document, main) {
  const youtubeLink = document.querySelector('.embed-video-container iframe.embed-responsive-item')?.src;
  if (!youtubeLink) {
    return;
  }
  main.append(youtubeLink);
  main.innerHTML += `${youtubeLink} <p> --- </p>`;
}

function createCardBlocks(main, document) {
  const articleCards = document.querySelectorAll('.vc_grid-item-mini.vc_clearfix');
  let pillar = '';
  let toggle = false;
  articleCards.forEach((card, index) => {
    if (index === 0 || index % 3 === 0) {
      toggle = !toggle;

      const hasMindsetClass = !!card.querySelector('.mindset');
      if (hasMindsetClass) {
        pillar = 'Focus';
      }
      // check if card has movement class
      const hasMovementClass = !!card.querySelector('.movement');
      if (hasMovementClass) {
        pillar = 'Fitness';
      }
      // check if card has nourishment class
      const hasNourishmentClass = !!card.querySelector('.nourishment');
      if (hasNourishmentClass) {
        pillar = 'Fuel';
      }
      // check if card has regeneration class
      const hasRegenerationClass = !!card.querySelector('.regeneration');
      if (hasRegenerationClass) {
        pillar = 'Recover';
      }
    }
    const temp = [];
    const div = document.createElement('div');

    // get image
    div.append(card.querySelector('.vc_gitem-animated-block img'));

    div.innerHTML += '<br/>';

    // get message above the article link
    const linksAboveArticle = card.querySelector('.vc_gitem-zone.vc_gitem-zone-c.tfl-post-grid-title-wrap .tfl-tags');
    // iterate linksAboveArticle to extract anchor link's textContent
    // create a variable to store the textContent
    let msg = '';
    linksAboveArticle.querySelectorAll('a').forEach((l) => {
      const linkText = l.textContent.toUpperCase();
      msg += `${linkText}, `;
    });
    // remove the last comma
    msg = msg.replace(/,\s*$/, '');
    const h = document.createElement('h4');
    h.textContent = msg;
    div.append(h);

    div.innerHTML += '<br/>';

    // new line and article link
    div.append(card.querySelector('.vc_custom_heading.tfl-post-grid-title.vc_gitem-post-data.vc_gitem-post-data-source-post_title a'));
    div.innerHTML += '<br/>';

    // new line and author
    const author = card.querySelector('.vc_gitem-zone.vc_gitem-zone-c.tfl-post-grid-title-wrap .tfl-post-grid-author a').textContent;
    const authorLink = document.createElement('a');
    authorLink.href = `https://main--24life--hlxsites.hlx.page/author/${author.toLowerCase().replace(/\s/g, '-')}`;
    authorLink.textContent = author;
    div.append(document.createTextNode('By '));
    div.innerHTML += authorLink.outerHTML;
    temp.push(div);

    let cardName = `Card (${pillar})`;
    if (toggle && (index) % 3 === 0) {
      cardName = `Card (${pillar}, Large)`;
    }
    if (!toggle && (index + 1) % 6 === 0) {
      cardName = `Card (${pillar}, Large, Right)`;
    }
    main.append(WebImporter.DOMUtils.createTable([[`${cardName}`], temp], document));
    // add a section metadata block at every 3rd card
    if ((index + 1) % 3 === 0) {
      // add section block
      main.append(WebImporter.DOMUtils.createTable([['Section Metadata'], ['Style', 'two-columns']], document));
      main.innerHTML += '<p> --- </p>';
    }
  });
}

function createSubscribeForm(main, document) {
  main.append(WebImporter.DOMUtils.createTable([['Subscribe Form']], document));
  main.innerHTML += '<p> --- </p>';
}

function createMagazineFooter(main, document) {
  const focus = ['Focus', 'Focus – Lead Your Life'];
  const fitness = ['Fitness', 'Fitness – Move Your Life'];
  const fuel = ['Fuel', 'Fuel – Feed Your Life'];
  const recover = ['Recover', 'Recover – Love Your Life'];
  const rows = [['Magazine Footer '], focus, fitness, fuel, recover];
  main.append(WebImporter.DOMUtils.createTable(rows, document));
  main.innerHTML += '<p> --- </p>';
}

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;
  const meta = {};
  meta.Title = document.querySelector('title').textContent.replace(/-\s*24Life/gm, '');
  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'WebPage')?.datePublished.replace(/T.*$/, '');
  meta.Image = createImg(document.querySelector('meta[property="og:image"]').content);
  const block = generateBlock(document, meta, 'Metadata');
  main.append(block);
  return meta;
};

const createMagazineHero = async (main, document, params) => {
  const magazineHero = {};

  const layers = document.querySelectorAll('.rs-layer-static.rs-layer');
  magazineHero.Title = layers[layers.length - 2].textContent;
  magazineHero.Issue = layers[layers.length - 3];
  magazineHero.Description = layers[layers.length - 1].textContent;
  const pillars = document.querySelectorAll('.tp-selecttoggle.rs-layer-static.rs-layer.rs-waction');

  const focusDiv = document.createElement('div');
  focusDiv.innerHTML = link(pillars[0].innerHTML, extractURL(pillars[0].outerHTML)).outerHTML;
  magazineHero.Focus = focusDiv;

  const fitnessDiv = document.createElement('div');
  fitnessDiv.innerHTML = link(pillars[1].innerHTML, extractURL(pillars[1].outerHTML)).outerHTML;
  magazineHero.Fitness = fitnessDiv;

  const fuelDiv = document.createElement('div');
  fuelDiv.innerHTML = link(pillars[2].innerHTML, extractURL(pillars[2].outerHTML)).outerHTML;
  magazineHero.Fuel = fuelDiv;

  const recoverDiv = document.createElement('div');
  recoverDiv.innerHTML = link(pillars[3].innerHTML, extractURL(pillars[3].outerHTML)).outerHTML;
  magazineHero.Recover = recoverDiv;

  magazineHero.Images = [];
  const elements = document.querySelectorAll('rs-slide rs-sbg-px rs-sbg-wrap rs-sbg');
  elements.forEach((element) => {
    const src = new DOMParser().parseFromString(element.outerHTML, 'text/html').body.firstChild.getAttribute('src');
    magazineHero.Images.push(createImg(src));
  });
  main.append(generateBlock(document, magazineHero, 'magazine-hero'));
};

function link(text, url) {
  const article = document.createElement('a');
  console.log(`url: ${url}`);
  // if url doesnt have domain, add it
  let newUrl = '';
  try {
    newUrl = new URL(url);
  } catch (e) {
    console.info(`url: ${url} is not a valid url cause new URL(url) failed`);
    newUrl = new URL('https://main--24life--hlxsites.hlx.page');
    newUrl.pathname = url;
  }
  article.href = newUrl.href;
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

function createImg(src) {
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
        valueCell.innerHTML = value.map((v) => v.outerHTML).join('');
      } else if (typeof value === 'string') {
        valueCell.textContent = value;
      } else {
        valueCell.innerHTML = value.outerHTML;
      }
    }
  }
  return table;
}
