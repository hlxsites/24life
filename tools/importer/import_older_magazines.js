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

    createMagazineHeader(main, document);
    console.log('magazine header created');

    createCardBlocks(main, document);
    console.log('SingleCard created');

    WebImporter.DOMUtils.remove(main, [
      '.mpad.light-wrapper.normal-padding.vc_row.wpb_row.vc_row-fluid.mpad.light-wrapper.normal-padding',
      '.vc_grid-item-mini.vc_clearfix',
      '.image-bg.not-parallax.tfl-constant-contact-wrapper.bg-dark.normal-padding.vc_row.wpb_row.vc_row-fluid.tfl-constant-contact-wrapper.bg-dark.normal-padding',
      '.wpb_text_column.wpb_content_element .wpb_wrapper',
      '.embed-video-container iframe.embed-responsive-item',
      '.tfl-magazine-current-issue-footer',
      '.social-list.list-inline',
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

function fixLinkHref(url) {
  console.log(`url: ${url}`);
  // if url doesnt have domain, add it or update it to main--24life--hlxsites.hlx.page
  let newUrl = '';
  try {
    newUrl = new URL(url);
  } catch (e) {
    console.info(`url: ${url} is not a valid url cause new URL(url) failed`);
    newUrl = new URL('https://main--24life--hlxsites.hlx.page');
    newUrl.pathname = url;
  }
  if (newUrl.hostname) {
    newUrl.hostname = 'main--24life--hlxsites.hlx.page';
  }
  return newUrl.toString();
}

function createMagazineHeader(main, document) {
  const linkedImage = document.querySelectorAll('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_single_image a')[0];
  const imageOnly = document.querySelectorAll('section.wpb-content-wrapper > section:nth-child(2) .row .vc_single_image-img')[0];
  if (linkedImage) {
    linkedImage.href = fixLinkHref(linkedImage);
  }
  const image = linkedImage || imageOnly;
  const imageDiv = document.createElement('div');
  imageDiv.append(image);

  const issue = document.querySelector('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_text_column.wpb_content_element > div > h5');
  const issueTitle = document.querySelector('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_text_column.wpb_content_element > div > h1');
  const issueDescription = document.querySelector('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_text_column.wpb_content_element > div > h4');
  const quote = document.querySelector('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_text_column.wpb_content_element > div > p.tfl-quote');
  const quoteSignature = document.querySelector('section.wpb-content-wrapper > section:nth-child(2) .row .wpb_text_column.wpb_content_element > div > p.tfl-quote-signature');

  const contentElements = document.createElement('div');
  contentElements.append(issue);
  contentElements.append(issueTitle);
  contentElements.append(issueDescription);
  contentElements.append(quote);
  contentElements.append(quoteSignature);

  main.append(WebImporter.DOMUtils.createTable([['Columns(old-magazine-header)'], [imageDiv, contentElements]], document));
  main.innerHTML += '<p> --- </p>';
}

/*
 * content structure: in first cell:
 *  - p > image
 *  - p > COLLECTIONS (optional)
 *  - title as linked h1, h2, h3, h4, h5, or h6
 *  - p > author with link (optional)
 */
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
    const cardsContainer = [];
    const div = document.createElement('div');

    // get image
    const imageWrapper = document.createElement('p');
    const articleImage = card.querySelector('.vc_gitem-animated-block img');

    // get message above the article link
    const collections = card.querySelector('.vc_gitem-zone.vc_gitem-zone-c.tfl-post-grid-title-wrap .tfl-tags');
    // iterate linksAboveArticle to extract anchor link's textContent
    // create a variable to store the textContent
    let msg = '';
    collections.querySelectorAll('a').forEach((l) => {
      const linkText = l.textContent.toUpperCase();
      msg += `${linkText}, `;
    });
    // remove the last comma
    msg = msg.replace(/,\s*$/, '');
    const collectionsContainer = document.createElement('p');
    collectionsContainer.append(msg);

    // article link
    const article = document.createElement('h2');
    const anchor = card.querySelector('.vc_custom_heading.tfl-post-grid-title.vc_gitem-post-data.vc_gitem-post-data-source-post_title a');
    anchor.href = `https://main--24life--hlxsites.hlx.page${anchor.href}`;
    article.append(anchor);

    // link image to article
    const articleImgLink = document.createElement('a');
    articleImgLink.href = anchor.href;
    // add img tag to anchor tag
    articleImgLink.append(articleImage);
    imageWrapper.append(articleImgLink);
    div.append(imageWrapper);
    div.append(collectionsContainer);
    div.append(article);

    //   author
    const author = card.querySelector('.vc_gitem-zone.vc_gitem-zone-c.tfl-post-grid-title-wrap .tfl-post-grid-author a').textContent;
    const authorLink = document.createElement('a');
    authorLink.href = `https://main--24life--hlxsites.hlx.page/author/${author.toLowerCase().replace(/\s/g, '-')}`;
    authorLink.textContent = author;
    div.append(document.createTextNode('By '));
    div.innerHTML += authorLink.outerHTML;
    cardsContainer.push(div);

    let cardName = `Card (${pillar})`;
    if (toggle && (index) % 3 === 0) {
      cardName = `Card (${pillar}, Large)`;
    }
    if (!toggle && (index + 1) % 6 === 0) {
      cardName = `Card (${pillar}, Large, Right)`;
    }
    main.append(WebImporter.DOMUtils.createTable([[`${cardName}`], cardsContainer], document));
    // add a section metadata block at every 3rd card
    if ((index + 1) % 3 === 0) {
      // add section block
      main.append(WebImporter.DOMUtils.createTable([['Section Metadata'], ['Style', 'two-columns']], document));
      main.innerHTML += '<p> --- </p>';
    }
  });
}

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;
  const meta = {};
  meta.Title = document.querySelector('title').textContent.replace(/-\s*24Life/gm, '');
  meta.Description = ldJSON['@graph'].find((item) => item['@type'] === 'WebSite')?.description;
  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'WebPage')?.datePublished.replace(/T.*$/, '');
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);
  return meta;
};
