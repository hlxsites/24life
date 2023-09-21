/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax,
 no-unused-vars, no-await-in-loop, prefer-destructuring */

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

    await createMagazineSummary(main, document, params);
    console.log('MagazineSummary created');

    WebImporter.DOMUtils.remove(main, [
      '.mpad.light-wrapper.normal-padding.vc_row.wpb_row.vc_row-fluid.mpad.light-wrapper.normal-padding',
      '.vc_grid-item-mini.vc_clearfix',
      '.image-bg.not-parallax.tfl-constant-contact-wrapper.bg-dark.normal-padding.vc_row.wpb_row.vc_row-fluid.tfl-constant-contact-wrapper.bg-dark.normal-padding',
      '.wpb_text_column.wpb_content_element .wpb_wrapper',
      '.embed-video-container iframe.embed-responsive-item',
      '.tfl-magazine-current-issue-footer',
      '.vc_single_image-wrapper',
      '.vc_pageable-load-more-btn',
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

const createMetadata = (main, document) => {
  const meta = {};
  meta.robots = 'no-index, no-follow';
  meta.guide = '';
  const block = generateBlock(document, meta, 'Metadata');
  main.append(block);
  return meta;
};

const createMagazineSummary = async (main, document, params) => {
  const magazineHero = {};
  const ogURL = `https://main--24life--hlxsites.hlx.page${document.querySelector('meta[property="og:url"]').content.replace(/\/$/, '')}`;
  magazineHero.Link = link(ogURL, ogURL);
  magazineHero.Title = document.querySelector('meta[property="og:title"]').content.split(/-/)[0];
  const pillars = document.querySelectorAll('.tfl-magazine-current-issue-footer .tfl-pt80-special .wpb_wrapper .wpb_wrapper');

  if (pillars.length > 0) {
    for (const section of pillars) {
      const labelTag = section.querySelector('h5.tfl-anm');
      if (labelTag) {
        const label = replacePillar(labelTag.innerHTML);
        const group = label.split(/[ -]/)[0];
        const grpArray = [];
        const links = section.querySelectorAll('a');
        const labelDiv = document.createElement('div');
        labelDiv.innerHTML = label;
        grpArray.push(labelDiv);
        for (const a of links) {
          const aYear = await getArticleYear(a.href);
          let sectionDiv = document.createElement('div');
          sectionDiv = link(a.innerHTML, a.href, group.toLowerCase(), aYear);
          grpArray.push(sectionDiv);
        }
        magazineHero[group] = grpArray;
      }
    }
    magazineHero.Image = [];
    const element = document.querySelector('meta[property="og:image"]').content;
    magazineHero.Image.push(createImg(element));
    main.append(generateBlock(document, magazineHero, 'Magazine Summary'));
  }
};

async function getArticleYear(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const dateMetaTag = doc.querySelector('meta[property="article:modified_time"') || doc.querySelector('meta[property="article:published_time"');
    const publicationDate = dateMetaTag?.getAttribute('content');
    return new Date(publicationDate).getFullYear();
  } catch (error) {
    console.error(`Error fetching or parsing the web page: ${error.message}`);
    return null;
  }
}

function replacePillar(label) {
  const words = label.split(/ /);
  const wordReplacements = {
    'Mindset-': 'Focus -',
    Movement: 'Fitness',
    Nourishment: 'Fuel',
    Regeneration: 'Recover',
  };
  const firstWord = words[0];
  const replacement = wordReplacements[firstWord];

  if (replacement) {
    words[0] = replacement;
    return words.join(' ');
  }
  return label;
}

function link(text, url, group = null, year = null) {
  const article = document.createElement('a');
  console.log(`url: ${text} - ${url}`);
  let newUrl = '';
  if (group && year) {
    newUrl = new URL(`https://main--24life--hlxsites.hlx.page/${group}/${year}${url.replace(/\/$/, '')}`);
  } else {
    newUrl = new URL(url);
  }
  article.href = newUrl.href;
  article.textContent = text;
  return article;
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
