/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this, no-restricted-syntax, no-unused-vars */

export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;

  const meta = {};

  meta.Template = 'article';
  meta.Description = document.querySelector('meta[property="og:description"]')
    .content
    .replace(/^- /, '');

  meta.Collections = [...document.querySelectorAll('.tfl-page-title-wrap .tfl-the-tags a.tfl-tag')]
    .map((tag) => tag.textContent.trim())
    .join(', ');

  meta.Section = ldJSON['@graph'].find((item) => item['@type'] === 'Article').articleSection.join(', ');

  meta.Author = ldJSON['@graph'].filter((item) => item['@type'] === 'Person')
    .map((item) => item.name)
    .join(', ');

  meta.Keywords = ldJSON['@graph'].find((item) => item['@type'] === 'Article')
    .keywords
    .join(', ');

  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'Article')
    .datePublished;

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  // eslint-disable-next-line prefer-destructuring
  params.year = meta['Publication Date'].split('-')[0];
  params.Section = meta.Section;
  return meta;
};

function removeLinksFromImagesPointingToItself(main) {
  for (const img of main.querySelectorAll('img')) {
    const link = img.closest('a');
    if (link && link.href === img.src) {
      link.replaceWith(img);
    }
  }
}

export default {
  preprocess: ({
    document, url, html, params,
  }) => {
    const ldJSON = document.querySelector('script[type="application/ld+json"]');
    params.ldJSON = JSON.parse(ldJSON.textContent);
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
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
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
    const img = main.querySelector('img');
    h1.after(img);

    createMetadata(main, document, params);

    removeLinksFromImagesPointingToItself(main);

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

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const filename = WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, ''));
    if (!params.Section || !params.year) {
      throw new Error(`missing params section or year. ${JSON.stringify(params)}`);
    }
    return `${toClassName(params.Section)}/${toClassName(params.year)}/${filename}`;
  },
};
