import {
  decorateBlocks,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  loadScript,
  sampleRUM,
  waitForLCP,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

export function linkSmallImagesToFullImages(container) {
  for (const picture of container.querySelectorAll('.section.small-images picture')) {
    if (picture.closest('div.block') || picture.closest('a')) {
      // don't link if already in a block or a link.
      // eslint-disable-next-line no-continue
      continue;
    }

    const link = document.createElement('a');
    link.href = picture.querySelector('img').src;
    link.innerHTML = picture.outerHTML;
    picture.replaceWith(link);
  }
}

export function decorateLinkedPictures(container, processInBlocks = true) {
  /* MS Word online does not support linked images. As a workaround use any links
  that are directly after the image. */

  // picture + br + a in the same paragraph
  [...container.querySelectorAll('picture + br + a, picture + a')]
  // link text is an unformatted URL paste
    .filter((a) => a.textContent.trim().startsWith('http'))
    .forEach((a) => {
      const br = a.previousElementSibling;
      let picture = br.previousElementSibling;
      if (br.tagName === 'PICTURE') picture = br;
      picture.remove();
      br.remove();
      a.innerHTML = picture.outerHTML;
      // make sure the link is not decorated as a button
      a.parentNode.classList.remove('button-container');
      a.className = '';
    });

  // with link and image in separate paragraphs
  [...container.querySelectorAll('p > a[href]')]
  // don't decorate if already in a block. Instead, the block should call this function.
    .filter((a) => !a.closest('div.block') || processInBlocks)
  // link (in a <p>) has no siblings
    .filter((a) => a.parentNode.childElementCount === 1)
  // is preceded by an image (in a <p>) and image has no other siblings
    .filter((a) => a.parentNode.previousElementSibling?.firstElementChild?.tagName === 'PICTURE')
    .filter((a) => a.parentNode.previousElementSibling?.childElementCount === 1)
  // link text is an unformatted URL paste
    .filter((a) => a.textContent.trim().startsWith('http'))
    .forEach((a) => {
      const picture = a.parentNode.previousElementSibling.firstElementChild;
      picture.parentNode.remove();
      a.innerHTML = picture.outerHTML;
      // make sure the link is not decorated as a button
      a.parentNode.classList.remove('button-container');
      a.className = '';
    });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

export function getYoutubeVideoId(url) {
  if (url.includes('youtube.com/watch?v=')) {
    return new URL(url).searchParams.get('v');
  }
  if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
    return new URL(url).pathname.split('/').pop();
  }
  return null;
}

function decorateVideoLinks(main) {
  [...main.querySelectorAll('a')]
    .filter(({ href }) => !!href)
  // only convert plain links
    .filter((a) => a.textContent?.trim()?.toLowerCase().startsWith('http'))
  // don't decorate if already in a block. unless it's `columns`.
    .filter((a) => {
      const block = a.closest('div.block');
      if (!block) return true;
      return block.classList.contains('columns');
    })
    .forEach((link) => {
      const youtubeVideoId = getYoutubeVideoId(link.href);

      if (youtubeVideoId) {
        loadCSS(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.css`);
        loadScript(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.js`);
        const video = document.createElement('lite-youtube');
        video.setAttribute('videoid', youtubeVideoId);
        video.setAttribute('params', 'rel=0');
        video.classList.add('youtube-video');
        link.replaceWith(video);
      }
    });
}

function decorateSpotifyLinks(main) {
  [...main.querySelectorAll('a')]
    .filter(({ href }) => href.includes('open.spotify.com/embed'))
  // don't decorate if already in a block.
    .filter((a) => !a.closest('div.block'))
    .forEach((link) => {
      const iframe = document.createElement('iframe');
      iframe.classList.add('spotify-embed');
      iframe.width = 800;
      iframe.height = 300;
      iframe.src = link.href;
      iframe.title = link.textContent;
      iframe.frameborder = 0;
      iframe.allow = 'encrypted-media';
      iframe.allowfullscreen = true;
      link.replaceWith(iframe);
    });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    decorateLinkedPictures(main, false);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // 24life only uses buttons in article template, so we call this from there instead
  // decorateButtons(main);

  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateVideoLinks(main);
  decorateSpotifyLinks(main);
  linkSmallImagesToFullImages(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  if (!document.title.match(/- 24Life(\.com)?$/i)) {
    document.title += ' - 24Life';
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    const templateName = getMetadata('template');
    if (templateName) {
      await loadTemplate(doc, templateName.toLowerCase());
    }
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));

  // set global accent color
  const section = getMetadata('section')?.toLowerCase();
  if (section) {
    document.body.style.setProperty('--accent-color', `var(--color-${section})`);
  } else {
    document.body.style.setProperty('--accent-color', 'var(--color-default-card)');
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

// from https://www.hlx.live/developer/block-collection
async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`);
    const decorationComplete = (async () => {
      try {
        const mod = await import(`../templates/${templateName}/${templateName}.js`);
        if (mod.default) {
          await mod.default(doc);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`failed to load module for ${templateName}`, error);
      }
    })();

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}
