// use with https://www.24life.com/experts/

// needs https://github.com/adobe/helix-importer/issues/201
// do a full-text-search in intellij for EMPTY_TAGS_TO_PRESERVE and add 'i'

/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

// import { toClassName } from '../../scripts/lib-franklin';
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

function findRole(author) {
  // get any h2 that comes before the current section
  let el = author.closest('section');
  while (el.previousElementSibling) {
    if (el.previousElementSibling.tagName === 'H2') {
      const fullRole = el.previousElementSibling.textContent;
      if (fullRole.includes('Experts')) {
        return 'Expert';
      } if (fullRole.includes('Staff')) {
        return 'Staff';
      } if (fullRole.includes('Writers')) {
        return 'Writer';
      }
      throw new Error(`Unknown role: ${fullRole}`);
    } else {
      el = el.previousElementSibling;
    }
  }
  throw new Error(`no role found for ${author.textContent}`);
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

    const authors = [...document.querySelectorAll('.wpb_column')];
    // const authors = [document.querySelector('.wpb_column')];

    return authors
      .filter((author) => author.querySelector('h3'))
      // .filter((author, index) => index > 2 && index <= 3)
      .map((author) => {
        const title = author.querySelector('h3');
        const description = author.querySelector('.tf-author-description');
        const image = author.querySelector('.tfl-author-image');

        const socialIconsLinks = [...author.querySelectorAll('.btn-icon')]
          .map((icon) => icon.href);

        const extraLinks = [...author.querySelectorAll('.tfl-author-url')]
          .map((link) => link.href);
        const authorId = getAuthorId(title);

        const result = document.createElement('div');
        const h1 = document.createElement('h1');
        h1.textContent = title.textContent;
        result.append(h1);

        const emptyLine = document.createElement('p');
        emptyLine.textContent = ' ';
        result.append(emptyLine);

        const meta = {};
        meta.Image = image;
        meta.Description = description;
        meta.Links = [...socialIconsLinks, ...extraLinks];
        meta.Role = findRole(author);
        meta.Template = 'author';
        const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
        result.append(metadataBlock);

        const articleListBlock = [['Article List '], ['']];
        result.append(WebImporter.DOMUtils.createTable(articleListBlock, document));

        return ({
          element: result,
          path: WebImporter.FileUtils.sanitizePath(`author/${authorId}`),
        });
      });
  },
};
