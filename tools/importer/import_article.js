/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax, no-unused-vars */

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

    // currently not supporting magazine articles, TODO: handle
    if (document.querySelector('.mb_YTPlayer')) {
      throw new Error('Magazine article not supported');
    }
    if (!document.querySelector('.tfl-page-title-wrap')) {
      throw new Error('only normal articles are supported');
    }

    // start with h1, then image
    const h1 = main.querySelector('h1');
    main.prepend(h1);
    let img = main.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.src = 'http://localhost:3001/dummy-article-hero-image/media_127d7667d1e27556e2e4570b95d44f0dfc591529a.png?host=https%3A%2F%2Fmain--24life--hlxsites.hlx.page';
    }
    h1.after(img);

    createMetadata(main, document, params);

    // after getting the metadata, remove extra elements
    WebImporter.DOMUtils.remove(main, [
      '.page-title.image-bg',
      '.tfl-the-tags',
      '.post-title',
      '.post-meta',
      '.tags.pull-right',
    ]);
    for (const entry of main.querySelectorAll('.tfl-author-entry')) {
      entry.closest('.row').remove();
    }

    fixEmptySpan(main, document);
    fixDoubleBoldText(main, document);
    fixBoldedWhitespace(main, document);
    fixUnderscoreInLinks(main, document);
    removeLinksFromImagesPointingToItself(main);
    moveFloatingImagesToSeparateLine(main, document);
    makeCaptionTextItalics(main, document);
    detectColumns(main, document);
    detectYoutube(main, document);
    await articleEmbeds(main, document);
    detectQuotes(main, document);
    fixInvalidLists(main, document);

    const filename = new URL(url).pathname
      .replace(/\/$/, '')
      // eslint-disable-next-line prefer-regex-literals
      .replace(new RegExp('^/'), '');
    const { section, year } = params;
    if (!section || !year) {
      throw new Error(`missing params section or year. ${JSON.stringify(params)}`);
    }
    const newPath = WebImporter.FileUtils.sanitizePath(`${toClassName(section)}/${toClassName(year)}/${filename}`);
    return {
      element: main,
      path: newPath,
      report: {
        previewUrl: `https://main--24life--hlxsites.hlx.page${newPath}`,
      },
    };
  },
};

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;

  const meta = {};

  meta.Description = document.querySelector('meta[property="og:description"]')
    .content
    .replace(/^- /, '');
  meta.Description = removeOldSectionNamesFromDescriptin(meta.Description);

  meta.Collections = [...document.querySelectorAll('.tfl-page-title-wrap .tfl-the-tags a.tfl-tag')]
    .map((tag) => tag.textContent.trim())
    .join(', ');

  // "meta.section" is not needed, it is added automatically by metadata.xlsx at runtime
  params.section = getMainSectionFromArticleSection(ldJSON['@graph'].find((item) => item['@type'] === 'Article').articleSection);

  // additional categories
  meta.Categories = getAdditionalCategoriesFromArticleSection(ldJSON['@graph'].find((item) => item['@type'] === 'Article').articleSection);

  meta.Authors = ldJSON['@graph'].filter((item) => item['@type'] === 'Person')
    .map((item) => item.name)
    .join(', ');

  meta.Keywords = ldJSON['@graph'].find((item) => item['@type'] === 'Article').keywords.join(', ');

  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'Article').datePublished;

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  // eslint-disable-next-line prefer-destructuring
  params.year = meta['Publication Date'].split('-')[0];
  return meta;
};

export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );
}

function getMainSectionFromArticleSection(articleSections) {
  if (!articleSections) {
    return 'fitness';
  }
  for (let articleSection of articleSections) {
    articleSection = articleSection.toLowerCase();

    if (articleSection === 'mindset'
      || articleSection === 'lifestyle'
      || articleSection === 'discover'
      || articleSection === 'flexibility'
      || articleSection === 'motivate') {
      return 'focus';
    }
    if (articleSection === 'nourishment') {
      return 'fuel';
    }
    if (articleSection === 'regeneration') {
      return 'recover';
    }
  }
  // fitness is the catch-all if nothing else matches
  return 'fitness';
}

function getAdditionalCategoriesFromArticleSection(articleSections) {
  if (!articleSections) {
    return [];
  }
  return articleSections.filter((section) => {
    const lowercaseSection = section.toLowerCase();
    return lowercaseSection !== 'mindset'
        && lowercaseSection !== 'movement'
        && lowercaseSection !== 'nourishment'
        && lowercaseSection !== 'regeneration';
  });
}

function removeOldSectionNamesFromDescriptin(description) {
  if (description.toLowerCase().startsWith('mindset - ')) {
    return description.substring('mindset - '.length);
  }
  if (description.toLowerCase().startsWith('movement - ')) {
    return description.substring('movement - '.length);
  }
  if (description.toLowerCase().startsWith('nourishment - ')) {
    return description.substring('nourishment - '.length);
  }
  if (description.toLowerCase().startsWith('regeneration - ')) {
    return description.substring('regeneration - '.length);
  }
  return description;
}

function removeLinksFromImagesPointingToItself(main) {
  for (const img of main.querySelectorAll('img')) {
    const link = img.closest('a');
    if (link && link.href.includes('twentyfourlife.wpenginepowered') && link.href.endsWith('.jpg')) {
      link.replaceWith(img);
    }
  }
}

function fixBoldedWhitespace(main, document) {
  // e.g. https://www.24life.com/all-eyes-on-sugar-what-you-should-know-about-the-fdas-new-nutrition-labels/
  for (const strong of main.querySelectorAll('strong')) {
    if (strong.textContent.trim() === '') {
      // keep content, but remove strong tag
      strong.before(...strong.childNodes);
      strong.remove();
    }
  }
  // move whitespace outside bolding
  // e.g. https://www.24life.com/sports-specific-training-tennis/
  for (const strong of main.querySelectorAll('strong')) {
    if (strong.outerHTML.includes(' </strong>')) {
      strong.parentElement.innerHTML = strong.parentElement.innerHTML.replaceAll(' </strong>', '</strong> ');
    }
  }
}

function moveFloatingImagesToSeparateLine(main, document) {
  // e.g. https://www.24life.com/pack-your-bag/ has images that are part of the h3.
  // when imported, we want the image to be after the heading, not before.
  for (const img of main.querySelectorAll('h3 img.alignleft, h3 img.alignright')) {
    const h3 = img.closest('h3');
    const p = document.createElement('p');
    p.appendChild(img);
    h3.after(p);
  }

  // e.g. https://www.24life.com/with-hard-knocks-brett-kicks-things-up-a-notch/
  // move images to their own paragraph
  for (const img of main.querySelectorAll('p img.alignleft, p img.alignright')) {
    const parent = img.closest('p');
    console.log('parent.childNodeCount', parent.childNodes.length);
    if (parent.childNodes.length > 1 && parent.firstChild === img) {
      const p = document.createElement('p');
      p.appendChild(img);
      parent.before(p);
    }
  }
}

function makeCaptionTextItalics(main, document) {
  for (const caption of main.querySelectorAll('.wp-caption-text')) {
    caption.innerHTML = `<em>${caption.innerHTML}</em>`;
  }
}

function detectColumns(main, document) {
  const rows = [...main.querySelectorAll('.row :is([class^="col-"], [class*=" col-"])')]
    // note: we ignore large columns like col-sm-12, col-md-10, etc.
    .filter((col) => {
      const width = [...col.classList].find((c) => c.includes('col-'))
        .split('-')[2];
      return width < 10;
    })
    .map((col) => col.closest('.row'));
  const uniqueRows = [...new Set(rows)];

  for (const row of uniqueRows) {
    // convert row to columns block
    const columns = Array.from(row.querySelectorAll('[class^="col-"], [class*=" col-"]'));
    if (columns.length) {
      row.textContent = '';
      row.append(WebImporter.DOMUtils.createTable([
        ['Columns '],
        columns,
      ], document));
    }
  }
}

function detectQuotes(main, document) {
  for (const quote of main.querySelectorAll('blockquote')) {
    let text = quote.textContent.trim();
    if (text.startsWith('“') && text.endsWith('”')) {
      text = text.substring(1, text.length - 1);
    }

    quote.replaceWith(WebImporter.DOMUtils.createTable([
      ['Quote '],
      ['Text', text],
      ['Author', ''],
    ], document));
  }
}

function detectYoutube(main, document) {
  for (const iframe of main.querySelectorAll('iframe[src*="youtube.com"]')) {
    const a = document.createElement('a');

    let youtubeVideoId = '';
    if (iframe.src.includes('youtube.com/watch?v=')) {
      youtubeVideoId = new URL(iframe.src).searchParams.get('v');
    } else if (iframe.src.includes('youtube.com/embed/') || iframe.src.includes('youtu.be/')) {
      youtubeVideoId = new URL(iframe.src).pathname.split('/').pop();
    }
    if (youtubeVideoId) {
      a.href = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
    } else {
      throw new Error(`unknown youtube url: ${iframe.src}`);
    }
    a.textContent = a.href;
    iframe.replaceWith(a);
  }
}

async function articleEmbeds(main, document) {
  await Promise.all([...main.querySelectorAll('iframe.wp-embedded-content')].map(async (embed) => {
    if (embed.src.startsWith('/') && embed.src.includes('/embed/')) {
      // don't append elements from one doc to another. instead copy the HTML.
      const embedDoc = await fetchDocument(embed.src);
      WebImporter.DOMUtils.remove(embedDoc, ['.screen-reader-text']);

      const linkUrl = embedDoc.querySelector('a').href;
      const imageUrl = embedDoc.querySelector('img').src;
      const title = embedDoc.querySelector('.wp-embed-heading').textContent;

      const cell = document.createElement('div');
      cell.innerHTML = `
        <a href="${linkUrl}">
          <img src="${imageUrl}" alt="${title}"/>
          <h4>${title}</h4>
        </a>
      `;

      embed.replaceWith(WebImporter.DOMUtils.createTable([
        ['Columns (border)'],
        [cell],
      ], document));
    }
  }));
}

async function fetchDocument(path) {
  const articleUrl = `http://localhost:3001${path}?host=https%3A%2F%2Fwww.24life.com`;
  const response = await fetch(articleUrl);
  return new DOMParser().parseFromString(await response.text(), 'text/html');
}

function fixDoubleBoldText(main, document) {
  // e.g. https://www.24life.com/how-to-make-your-trip-to-the-gym-count/
  [...main.querySelectorAll('b > strong')].forEach((strong) => {
    const b = strong.closest('b');
    const span = document.createElement('span');
    span.append(...b.childNodes);
    b.replaceWith(span);
  });
  [...main.querySelectorAll('strong > b')].forEach((b) => {
    b.before(...b.childNodes);
    b.remove();
  });
}

function fixUnderscoreInLinks(main, document) {
  [...main.querySelectorAll('a > u')].forEach((u) => {
    u.before(...u.childNodes);
    u.remove();
  });
}

function fixInvalidLists(main, document) {
  // e.g. https://www.24life.com/ideas-for-a-valentines-day-date/
  for (const li of main.querySelectorAll('ul li')) {
    if (!li.previousElementSibling && !li.nextElementSibling && li.textContent.includes('\n• ')) {
      li.innerHTML = li.innerHTML.replaceAll('\n• ', '<li>');
    }
  }

  // e.g. https://www.24life.com/fermented-food-whats-the-fuss/
  for (const ul of main.querySelectorAll('ul > ul')) {
    ul.before(...ul.childNodes);
    ul.remove();
  }
}

function fixEmptySpan(main, document) {
  main.querySelectorAll('span').forEach((el) => {
    if (el.textContent.trim() === '') {
      el.before(...el.childNodes);
      el.remove();
    }
  });
}
