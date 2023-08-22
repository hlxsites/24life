import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS, getMetadata,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
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

function decorateVideoLinks(main) {
  [...main.querySelectorAll('a')]
    .filter(({ href }) => !!href)
    .forEach((link) => {
      let youtubeVideoId = '';
      if (link.href.includes('youtube.com/watch?v=')) {
        youtubeVideoId = new URL(link.href).searchParams.get('v');
      } else if (link.href.includes('youtube.com/embed/') || link.href.includes('youtu.be/')) {
        youtubeVideoId = new URL(link.href).pathname.split('/').pop();
      }
      if (youtubeVideoId) {
        const iframe = document.createElement('iframe');
        iframe.classList.add('youtube-video');
        iframe.width = 560;
        iframe.height = 315;
        iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`;
        iframe.title = 'YouTube video player';
        iframe.frameborder = 0;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowfullscreen = true;
        link.replaceWith(iframe);
      }
    });
}

function decorateSpotifyLinks(main) {
  [...main.querySelectorAll('a')]
    .filter(({ href }) => href.includes('open.spotify.com/embed'))
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
    buildHeroBlock(main);
    decorateVideoLinks(main);
    decorateSpotifyLinks(main);
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
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
  const templateName = getMetadata('template');
  if (templateName) {
    await loadTemplate(doc, templateName.toLowerCase());
  }

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
