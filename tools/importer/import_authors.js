// use with https://www.24life.com/experts/

// needs https://github.com/adobe/helix-importer/issues/201
// do a full-text-search in intellij for EMPTY_TAGS_TO_PRESERVE and add 'i'

/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

// import { toClassName } from '../../scripts/lib-franklin';

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

function getAuthorId(title) {
  let url = title?.querySelector('a')?.href;
  if (!url) {
    return toClassName(title.textContent);
  }
  // remove trailing slash from url
  url = url.replace(/\/$/, '');
  return url.split('/').pop();
}

export default {
  /**
   * Apply DOM operations to the provided document and return an array of
   * objects ({ element: HTMLElement, path: string }) to be transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {Array} The { element, path } pairs to be transformed
   */
  transform: ({
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
    ]);

    // create the metadata block and append it to the main element
    createMetadata(main, document);

    const authors = [...document.querySelectorAll('.wpb_column')];
    // const authors = [document.querySelector('.wpb_column')];

    return authors
      .filter((author) => author.querySelector('h3'))
      .map((author) => {
        // console.log('author', author.outerHTML);
        const title = author.querySelector('h3');
        const imageSrc = author.querySelector('.tfl-author-image')?.src;

        console.log('icons', author.querySelectorAll('.tfl-social-icons'));
        const socialIcons = [...author.querySelectorAll('.btn-icon')]
          .map((icon) => icon.href);

        const extraLinks = [...author.querySelectorAll('.tfl-author-url')]
          .map((link) => link.href);
        const authorId = getAuthorId(title);

        console.log({
          title, url, authorId, imageSrc, socialIcons, extraLinks,
        });

        const result = document.createElement('div');
        result.append([title.textContent, authorId, imageSrc, socialIcons, extraLinks]);

        return ({
          element: result,
          path: WebImporter.FileUtils.sanitizePath(`author/${authorId}`),
        });
      });
  },
};
