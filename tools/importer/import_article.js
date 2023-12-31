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
    // eslint-disable-next-line no-constant-condition,no-self-compare
    if (1 === 1) throw new Error('Import process is complete. Do not run this script again, as it might override manually changed pages.');

    const main = document.body;
    params.pdfsToDownload = [];

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
      '.tfl-constant-contact-wrapper',
      '.tfl-magazine-current-issue-footer',
      '.fbx-modal',
      'iframe[title="Twitter settings iframe"]',
    ]);
    main.querySelector('ul.social-list.list-inline')?.parentElement?.remove();
    main.querySelector('form.js-cm-form')?.closest('section').remove();
    for (const h5 of main.querySelectorAll('h5')) {
      // e.g. https://www.24life.com/a-day-in-the-life-of-a-u-s-olympian/
      if (h5.textContent.trim() === 'More to Explore') {
        h5.closest('section').remove();
      }
    }

    // detect magazine
    const magazineSection = main.querySelector('.row.fullscreen .vid-bg,.row .fullscreen.vid-bg, .cover.fullscreen');
    params.isMagazine = !!magazineSection;

    // Metadata table
    const metadataTable = createMetadata(main, document, params);
    const filename = new URL(url).pathname
      .replace(/\/$/, '')
    // eslint-disable-next-line prefer-regex-literals
      .replace(new RegExp('^/'), '');
    const { section, year } = params;
    if (!section || !year) {
      throw new Error(`missing params section or year. ${JSON.stringify(params)}`);
    }
    const newPath = WebImporter.FileUtils.sanitizePath(`${toClassName(section)}/${toClassName(year)}/${filename}`);
    params.newPath = newPath;

    if (magazineSection) {
      // magazine article e.g. https://www.24life.com/make-2019-the-year-you-dont-get-hurt/
      await detectMagazineHero(params, magazineSection, main, document);
    } else {
      // start with h1, then image
      const h1 = main.querySelector('h1');
      main.prepend(h1);
      let img = main.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.src = 'http://localhost:3001/dummy-article-hero-image/media_127d7667d1e27556e2e4570b95d44f0dfc591529a.png?host=https%3A%2F%2Fmain--24life--hlxsites.hlx.page';
      }
      h1.after(img);
    }

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

    // work around limitations of the importer:
    cleanupForImportCompatibility(main, document);

    // adjust content specific to 24life
    useHighresImagesAndRemoveLinks(main, document);
    detectPdfLinks(main, document, params);
    handleFloatingImages(main, document, metadataTable);
    makeCaptionTextItalics(main, document);
    removeFullWidthColumns(main, document);
    detectColumns(main, document, url);
    detectCarousel(main, document, url);
    detectRulers(main, document, url);
    detectYoutube(main, document);
    await articleEmbeds(main, document);
    detectQuotes(main, document);
    fixInvalidLists(main, document);
    magazineLinkMakeBoldAndItalic(main, document);

    const transformationResult = [{
      element: main,
      path: newPath,
      report: {
        previewUrl: `https://main--24life--hlxsites.hlx.page${newPath}`,
      },
    }];
    if (params.videoToDownload) {
      transformationResult.push(params.videoToDownload);
    }
    transformationResult.push(...params.pdfsToDownload);
    return transformationResult;
  },
};

const createMetadata = (main, document, params) => {
  const { ldJSON } = params;
  const keywords = ldJSON['@graph'].find((item) => item['@type'] === 'Article').keywords.join(', ');

  const meta = {};

  meta.Description = document.querySelector('meta[property="og:description"]')
    .content
    .replace(/^- /, '');
  meta.Description = removeOldSectionNamesFromDescriptin(meta.Description);

  if (params.isMagazine) {
    meta.Issue = keywords
      .split(',')
      .filter((keyword) => keyword.toLowerCase().trim().startsWith('volume') && keyword.toLowerCase().includes('issue'))
      .map((keyword) => toClassName(keyword.trim()))
      .pop();
  }

  meta.Collections = [...document.querySelectorAll('.tfl-page-title-wrap .tfl-the-tags a.tfl-tag')]
    .map((tag) => tag.textContent.trim())
    .join(', ');

  // "meta.section" is not needed, it is added automatically by metadata.xlsx at runtime
  params.section = getMainSectionFromArticleSection(ldJSON['@graph'].find((item) => item['@type'] === 'Article').articleSection);

  // additional categories
  meta.Categories = getAdditionalCategoriesFromArticleSection(ldJSON['@graph'].find((item) => item['@type'] === 'Article').articleSection);

  meta.Authors = ldJSON['@graph'].filter((item) => item['@type'] === 'Person')
    // e.g. https://www.24life.com/this-well-spiced-stew-feeds-a-crowd/
    .map((item) => item.name.replaceAll(', Ph.D.', '').replaceAll(', MPH RD', ''))
    .join(', ');

  meta.Keywords = keywords;

  meta['Publication Date'] = ldJSON['@graph'].find((item) => item['@type'] === 'Article').datePublished;

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  // eslint-disable-next-line prefer-destructuring
  params.year = meta['Publication Date'].split('-')[0];
  return block;
};

async function previewAndGetMediaUrlForFile(videoPath) {
  try {
    const postResp = await fetch(
      `https://admin.hlx.page/preview/hlxsites/24life/main/${videoPath}`,
      { method: 'POST' },
    );
    const status = await postResp.json();
    return status.preview.redirectLocation;
  } catch (e) {
    console.log('could not get media url for ', videoPath, e);
    console.log("run with 'save to files', then try again");
    return null;
  }
}
async function publishAndGetMediaUrlForFile(videoPath) {
  try {
    const postResp = await fetch(
      `https://admin.hlx.page/publish/hlxsites/24life/main/${videoPath}`,
      { method: 'POST' },
    );
    const status = await postResp.json();
    return status.live.redirectLocation;
  } catch (e) {
    console.log('could not get media url for ', videoPath, e);
    console.log("run with 'save to files', then try again");
    return null;
  }
}

async function detectMagazineHero(params, magazineSection, main, document) {
  let h1 = magazineSection.querySelector('h1');
  if (!h1) {
    // e.g. https://www.24life.com/saralyn-ward-helps-moms-feel-even-better-after-baby-than-before/
    h1 = magazineSection.querySelector('h2');
  }
  const img = main.querySelector('img');
  let videoLink;
  const video = magazineSection.querySelector('video source[src^="http"]');
  if (video) {
    const extension = video.src.split('.').pop();

    // check if the mp4 variant is ready
    const helixMediaUrl = await previewAndGetMediaUrlForFile(`${params.newPath}.mp4`);
    await publishAndGetMediaUrlForFile(`${params.newPath}.mp4`);
    if (helixMediaUrl) {
      videoLink = document.createElement('a');
      videoLink.href = `https://main--24life--hlxsites.hlx.page${helixMediaUrl}`;
      videoLink.textContent = videoLink.href;
    } else {
      // only download the original if the mp4 variant in Helix is not ready
      params.videoToDownload = {
        path: `${params.newPath}.${extension}`,
        from: video.src,
      };

      if (extension === 'mp4') {
        videoLink = document.createTextNode('TODO: add video link');
      } else {
        videoLink = document.createTextNode(`TODO: add video link (not mp4: ${params.newPath}.${extension})`);
      }
    }
  } else {
    const youtube = magazineSection.querySelector('div.player[data-video-id]');
    if (youtube) {
      videoLink = document.createElement('a');
      videoLink.href = youtube.dataset.videoId;
      videoLink.textContent = youtube.dataset.videoId;
    } else {
      videoLink = document.createTextNode('');
    }
  }

  magazineSection.replaceWith(WebImporter.DOMUtils.createTable([
    ['Article Hero Video'],
    ['Title', h1],
    ['Video', videoLink],
    ['Image', img],
  ], document));
}

/** There are a bunch of issues with hlx importer around bold text, which adds ** to the
 * final document. This is to prevent these issues. */
function cleanupForImportCompatibility(main, document) {
  function moveWhitespaceOutsideTag() {
    // move whitespace outside strong/b/em etc.
    // e.g. https://www.24life.com/sports-specific-training-tennis/
    // apply to all inline elements
    for (const el of main.querySelectorAll('a, b, em, i, small, span, strong')) {
      if (el.outerHTML.includes(` </${el.tagName.toLowerCase()}>`)) {
        el.innerHTML = el.innerHTML.trimEnd();
        el.after(' ');
      }
    }

    // remove empty tags
    // e.g. https://www.24life.com/energy-management-hormones/
    for (const el of main.querySelectorAll('a, b, em, i, small, span, strong')) {
      if (el.innerHTML.trim() === '') {
        el.remove();
      }
    }
  }

  function removeUnnecessarySpan() {
    // e.g. https://www.24life.com/surprising-superfoods/
    main.querySelectorAll('strong > span, em > span').forEach((el) => {
      // if there are no child elements, remove the span and move child nodes
      if (el.children.length === 0) {
        el.before(...el.childNodes);
        el.remove();
      }
    });
  }

  function fixDoubleBoldText() {
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

  function fixdoubleItalicText() {
    for (const em of main.querySelectorAll('em > em')) {
      em.before(...em.childNodes);
      em.remove();
    }
  }

  function fixBoldedOrItalicWhitespace() {
    // e.g. https://www.24life.com/all-eyes-on-sugar-what-you-should-know-about-the-fdas-new-nutrition-labels/
    for (const strong of main.querySelectorAll('strong, b, em')) {
      if (strong.textContent.trim() === '') {
        // keep content, but remove strong tag
        strong.before(...strong.childNodes);
        strong.remove();
      }
    }
  }

  function fixBoldMissingSpace() {
    // e.g. https://www.24life.com/traveling-transformation/
    // bug: https://github.com/adobe/helix-importer/issues/214
    for (const strong of main.querySelectorAll('strong, b')) {
      if (!strong.parentElement) {
        // ignore detached nodes
        // eslint-disable-next-line no-continue
        continue;
      }
      if (strong.outerHTML.includes(':</strong>')) {
        // after a colon we can assume a space is ok to have
        strong.parentElement.innerHTML = strong.parentElement.innerHTML.replaceAll(':</strong>', ':</strong> ');
      }
    }
  }

  function fixUnderscoreInLinks() {
    [...main.querySelectorAll('a > u')].forEach((u) => {
      u.before(...u.childNodes);
      u.remove();
    });
  }

  function fixBoldedLinks() {
    [...main.querySelectorAll('a > b, a > strong')].forEach((strong) => {
      strong.before(...strong.childNodes);
      strong.remove();
    });
    [...main.querySelectorAll('b > a, strong > a')].forEach((a) => {
      const strong = a.closest('b, strong');
      if (!strong) {
        // if this happens (which it should not) ignore it
        return;
      }
      strong.before(...strong.childNodes);
      strong.remove();
    });
  }

  function ignoredItalicSpecialChars() {
    // e.g. https://www.24life.com/the-art-of-focus/
    for (const em of main.querySelectorAll('em, i')) {
      if (em.innerHTML.trim().length === 1 && [',', '.', '_', '"'].includes(em.innerHTML.trim())) {
        em.before(em.textContent);
        em.remove();
      }
    }
  }

  moveWhitespaceOutsideTag(main, document);
  removeUnnecessarySpan(main, document);
  fixDoubleBoldText(main, document);
  fixdoubleItalicText(main, document);
  fixBoldedOrItalicWhitespace(main, document);
  fixBoldMissingSpace(main, document);
  fixUnderscoreInLinks(main, document);
  fixBoldedLinks(main, document);
  ignoredItalicSpecialChars(main, document);
}

function magazineLinkMakeBoldAndItalic(main, document) {
  [...main.querySelectorAll('a.btn')]
    .filter((a) => a.textContent.trim() === 'Next' || a.classList.contains('bg-dark'))
    .forEach((a) => {
      const em = document.createElement('em');
      em.innerHTML = a.outerHTML;
      a.replaceWith(em);
    });
}

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

function useHighresImagesAndRemoveLinks(main) {
  for (const img of main.querySelectorAll('img')) {
    const link = img.closest('a');
    if (link && link.href.includes('twentyfourlife.wpenginepowered.com')) {
      // use the highres image from the link instead of the lowres image from the img
      img.src = link.href;
      link.replaceWith(img);
    }
  }
}

function collectContentUntil(startEl, stopCriteria, document) {
  const content = document.createElement('div');
  let next = startEl.nextSibling || startEl.parentNode.nextSibling;
  while (next) {
    const nextNext = next.nextSibling;
    const parent = next.parentNode;

    if (next.nodeType === Node.ELEMENT_NODE && stopCriteria(next)) {
      break;
    }
    const newNext = next.nextSibling || next.parentNode.nextSibling;
    content.append(next);
    next = newNext;
  }
  return content;
}

function handleFloatingImages(main, document, metadataTable) {
  // e.g. https://www.24life.com/pack-your-bag/ has images that are part of the h3.
  // when imported, we want the image to be after the heading, not before.
  for (const img of main.querySelectorAll('h3 img.alignleft, h3 img.alignright')) {
    const h3 = img.closest('h3');
    const para = document.createElement('p');
    para.appendChild(img);
    h3.after(para);
  }

  // e.g. https://www.24life.com/with-hard-knocks-brett-kicks-things-up-a-notch/
  // move images to their own paragraph
  for (const img of main.querySelectorAll('p img.alignleft, p img.alignright')) {
    if (img.classList.contains('attachment-full')) {
      // eslint-disable-next-line no-continue
      continue;
    }
    // put everything in a Columns block until the next header or `.vc_column-inner`
    const imageLeft = img.classList.contains('alignleft');

    const sideText = collectContentUntil(
      img,
      (el) => el.tagName.toLowerCase().match('h[1-6]')
        || el.classList.contains('vc_column-inner')
        || el.tagName.toLowerCase() === 'table',
      document,
    );

    const tableData = [
      ['Columns'],
    ];
    if (imageLeft) {
      tableData.push([img.cloneNode(true), sideText]);
    } else {
      tableData.push([sideText, img.cloneNode(true)]);
    }
    const columns = WebImporter.DOMUtils.createTable(tableData, document);
    const columnsWrapper = document.createElement('div');
    columnsWrapper.append(columns);
    // if this is already inside a table, open a new table below
    if (img.closest('table')) {
      // e.g. https://www.24life.com/koya-webb-from-self-care-will-come-answers-and-purpose/
      img.closest('table').after(columnsWrapper);
      img.remove();
    } else {
      img.replaceWith(columnsWrapper);
    }
  }
}

async function detectPdfLinks(main, document, params) {
  for (const a of main.querySelectorAll('a[href$=".pdf"]')) {
    if (a.href.includes('twentyfourlife.wpenginepowered.com')) {
      const pdfName = a.href.split('/').pop();
      const hlxPdfPath = WebImporter.FileUtils.sanitizePath(`${params.newPath}/${pdfName}`);
      params.pdfsToDownload.push(
        {
          from: a.href,
          path: hlxPdfPath,
        },
      );
      a.href = hlxPdfPath;
      // eslint-disable-next-line no-await-in-loop
      await previewAndGetMediaUrlForFile(hlxPdfPath);
      // eslint-disable-next-line no-await-in-loop
      await publishAndGetMediaUrlForFile(hlxPdfPath);
    }
  }
}

function makeCaptionTextItalics(main, document) {
  for (const caption of main.querySelectorAll('.wp-caption-text')) {
    caption.innerHTML = `<em>${caption.innerHTML}</em>`;
  }
}

function removeFullWidthColumns(main, document) {
  // e.g. https://www.24life.com/four-experts-share-daily-rituals-for-a-season-and-life-of-success/
  for (const col of main.querySelectorAll('.row .col-md-12, .row .col-sm-12, .row .col-lg-12, .row .col-12')) {
    const row = col.closest('.row');
    if (row && row.childElementCount === 1) {
      row.before(...col.childNodes);
      row.remove();
    }
  }
}

function detectRulers(main, document, url) {
  if (url === 'http://localhost:3001/24-feel-good-worth-the-listen-podcasts-to-energize-your-holiday-shopping-experience/?host=https%3A%2F%2Fwww.24life.com') {
    for (const th of main.querySelectorAll('table th')) {
      if (th.textContent.trim() === 'Columns  (Small image)') {
        const hr = document.createElement('hr');
        th.closest('table').after(hr);
      }
    }
  }
}

function detectCarousel(main, document, url) {
  // e.g. https://www.24life.com/koya-webb-from-self-care-will-come-answers-and-purpose/
  for (const slideShow of main.querySelectorAll('.wpb_gallery_slides')) {
    const tableData = [
      ['Carousel'],
    ];
    const images = [...slideShow.querySelectorAll('img.attachment-full')].map((img) => img.src);
    const uniqueImages = [...new Set(images)];
    for (const src of uniqueImages) {
      const image = document.createElement('img');
      image.src = src;
      tableData.push([image]);
    }
    slideShow.replaceWith(WebImporter.DOMUtils.createTable(tableData, document));
  }
  // e.g. https://www.24life.com/how-to-keep-your-feet-on-the-ground-and-head-in-the-stars/
  for (const slideShow of main.querySelectorAll('.ts-pagawa-slideshow-container')) {
    const tableData = [
      ['Carousel'],
    ];
    for (const image of slideShow.querySelectorAll('.ps-current ul li img')) {
      const imageAndCaption = document.createElement('div');
      imageAndCaption.append(p(image, document));
      imageAndCaption.append(p(image.alt, document));
      tableData.push([imageAndCaption]);
    }
    slideShow.replaceWith(WebImporter.DOMUtils.createTable(tableData, document));
  }
}

function detectColumns(main, document, url) {
  const rows = [...main.querySelectorAll(':is([class^="col-"], [class*=" col-"])')]
    // note: we ignore large columns like col-sm-12, col-md-10, etc.
    .filter((col) => {
      const width = [...col.classList].find((c) => c.includes('col-'))
        .split('-')[2];
      return width < 10;
    })
    .map((col) => col.parentElement);
  const uniqueRows = [...new Set(rows)];

  let variant = '';
  if (url === 'http://localhost:3001/24-feel-good-worth-the-listen-podcasts-to-energize-your-holiday-shopping-experience/?host=https%3A%2F%2Fwww.24life.com') {
    variant = ' (Small image)';
  }

  for (const row of uniqueRows) {
    // convert row to columns block
    const columns = Array.from(row.querySelectorAll('[class^="col-"], [class*=" col-"]'));
    if (columns.length) {
      if (columns.length === 2 && columns[0].classList.contains('col-md-push-6')) {
        // swap columns, e.g. https://www.24life.com/four-experts-share-daily-rituals-for-a-season-and-life-of-success/
        columns.reverse();
      }
      row.textContent = '';
      row.append(WebImporter.DOMUtils.createTable([
        [`Columns ${variant}`],
        columns,
      ], document));
    }
  }
}

function detectQuotes(main, document) {
  for (const quote of main.querySelectorAll('blockquote')) {
    if (quote.querySelector('h1, h2, h3, h4, h5, h6')) {
      // if there are headers in there, then it's not a quote. Replace with div instead
      // e.g. https://www.24life.com/gear-up-2/

      const div = document.createElement('div');
      div.innerHTML = quote.innerHTML;
      quote.replaceWith(div);

      // eslint-disable-next-line no-continue
      continue;
    }
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
      try {
        const embedDoc = await fetchDocument(embed.src);
        WebImporter.DOMUtils.remove(embedDoc, ['.screen-reader-text']);

        const linkUrl = embedDoc.querySelector('a').href;
        const imageUrl = embedDoc.querySelector('img').src;
        let title = embedDoc.querySelector('.wp-embed-heading')?.textContent;
        if (!title) {
          title = embed.title;
        }

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
      } catch (e) {
        throw new Error(`can not read iframe content: ${embed.src} ${e}`);
      }
    }
  }));
}

async function fetchDocument(path) {
  const articleUrl = `http://localhost:3001${path}?host=https%3A%2F%2Fwww.24life.com`;
  const response = await fetch(articleUrl);
  return new DOMParser().parseFromString(await response.text(), 'text/html');
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

function p(content, document) {
  const result = document.createElement('p');
  result.append(content);
  return result;
}
