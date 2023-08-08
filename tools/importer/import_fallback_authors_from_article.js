// only use with https://www.24life.com/author/* pages that are not listed in
//  https://www.24life.com/experts/
// This is a fallback that checks the article page for the bio.

/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

function imageParagraph(img, document) {
  const p = document.createElement('p');
  const newImg = document.createElement('img');
  newImg.src = img.src;
  p.append(newImg);
  return p;
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: async ({
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

    const firstLink = main.querySelector('.main-container a');
    if (!firstLink) {
      // TODO
      throw new Error('no article found');
    }
    const articleDoc = await getArticleDocument(firstLink);
    const authorBox = articleDoc.querySelector('.tfl-author-display-name')
      .closest('.container');

    // ---- Compose final result page ---
    const result = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = authorBox.querySelector('.tfl-author-display-name').textContent;
    result.append(h1);

    const emptyLine = document.createElement('p');
    emptyLine.textContent = ' ';
    result.append(emptyLine);

    const meta = {};
    meta.Image = imageParagraph(authorBox.querySelector('img'), document);
    meta.Description = authorBox.querySelector('.tfl-author-description').textContent;
    meta.Links = getAuthorLinks(document, authorBox);
    meta.Role = ''; // No role, as they are not listed on /experts/. Otherwise you should be using the other importer.
    meta.Template = 'author';
    result.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    const articleListBlock = [['Article List '], ['']];
    result.append(WebImporter.DOMUtils.createTable(articleListBlock, document));

    main.innerHTML = result.outerHTML;
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
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};

function getAuthorLinks(document, authorBox) {
  const allLinks = document.createElement('div');
  [...authorBox.querySelectorAll('.tfl-social-icons a')].forEach((icon) => {
    const a = document.createElement('a');
    a.href = icon.href;
    a.textContent = icon.href;
    const p = document.createElement('p');
    p.appendChild(a);
    allLinks.append(p);
  });

  [...authorBox.querySelectorAll('.tfl-author-url a')].forEach((link) => {
    link.textContent = link.href;
    const p = document.createElement('p');
    p.append(link);
    allLinks.append(p);
  });
  return allLinks;
}

async function getArticleDocument(firstLink) {
  const articleUrl = `http://localhost:3001${firstLink.href}?host=https%3A%2F%2Fwww.24life.com`;
  const response = await fetch(articleUrl);
  return new DOMParser().parseFromString(await response.text(), 'text/html');
}
