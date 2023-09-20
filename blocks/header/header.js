import { decorateIcons, loadBlocks, toClassName } from '../../scripts/lib-franklin.js';
import { decorateMain } from '../../scripts/scripts.js';

// media query match that indicates mobile/desktop switch
const MQ = window.matchMedia('(min-width: 992px)');

// prevent concurrent creation of the div while the nav content is being loaded
const CREATED = {
  focus: false, fitness: false, fuel: false, recover: false, magazine: false,
};

function toggleMenu(header, sectionToOpen) {
  const openSection = header.querySelector('header [aria-expanded="true"]');
  if (openSection === sectionToOpen) {
    return; // it's already open
  }
  openSection?.setAttribute('aria-expanded', 'false');
  sectionToOpen?.setAttribute('aria-expanded', 'true');
}

function closeMenuSection(event) {
  const navArea = document.querySelector('header');
  if (!navArea.contains(event.target)) {
    const openMenu = document.querySelector('header [aria-expanded="true"]');
    if (openMenu) {
      openMenu.setAttribute('aria-expanded', 'false');
    }
  }
}

async function buildSectionMenuContent(header, section) {
  if (CREATED[section]) return;

  CREATED[section] = true;
  try {
    const menu = await fetch(`/navigation/menu-${section}.plain.html`);
    if (menu.ok) {
      const fragment = document.createElement('div');
      fragment.classList.add('nav-fragment', section);
      fragment.innerHTML = await menu.text();
      fragment.setAttribute('aria-expanded', 'false');
      decorateMain(fragment);
      await loadBlocks(fragment);
      header.append(fragment);
    }
  } catch (e) {
    CREATED[section] = false;
    throw e;
  }
}

// toggle from event
async function mouseOverMenu(a, header) {
  if (!MQ.matches) {
    return; // only on desktop
  }
  const section = a.textContent.toLowerCase();
  if (!CREATED[section]) {
    await buildSectionMenuContent(header, section);
  }
  const sectionToOpen = header.querySelector(`:scope > .nav-fragment.${section}`);
  toggleMenu(header, sectionToOpen);
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // clear the block
  block.textContent = '';

  // fetch nav content
  const resp = await fetch('/nav.plain.html');

  if (resp.ok) {
    // get the navigation text, turn it into html elements
    const navContent = document.createRange().createContextualFragment(await resp.text());

    // start the nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    // add all the divs that will be part of the nav
    nav.innerHTML = `
      <div class="brand">
        <a class="logo" title="Homepage" href="/">
        </a>
      </div>

      <div id="main-nav-sections" class="sections">
        <ul class="sections-list">
        </ul>
      </div>

      <div id="main-menu-tools" class="tools">
      </div>

      <a href="#" class="hamburger-toggle" role="button" title="open menu" aria-expanded="false" aria-controls="main-nav-sections,main-menu-tools">
        <span class="icon icon-hamburger"></span>
      </a>

      <div class="search">
        <div class="search-label">
          <span class="icon icon-search"></span>
          <div class="title">Search Site</div>
        </div>
        <div class="search-container">
          <div class="search-wrapper">
            <div class='search-form'>
              <form action='/search' method='get'>
                <input type='search' name='q' class='search-input' placeholder="TYPE HERE"/>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // fill in the content from nav doc
    const logo = nav.querySelector('.logo');
    logo.append(navContent.children[0].querySelector('p:first-of-type > span'));
    const linksList = navContent.children[1].querySelector('ul');
    // add target=_blank to links
    [...linksList.querySelectorAll('a')].forEach((item) => {
      // skip newletter link
      if (item.href.includes('newsletter')) return;
      item.setAttribute('target', '_blank');
    });
    nav.querySelector('.tools').prepend(linksList);
    const sectionList = nav.querySelector('.sections .sections-list');

    // get through all section menus
    const sectionMenus = [...navContent.children[2].querySelectorAll('ul > li')]
      .map((menuBlock) => {
        const sectionTitle = menuBlock.firstElementChild.textContent;
        const navSection = document.createElement('li');
        navSection.classList.add('section', `color-${toClassName(sectionTitle)}`);
        const a = document.createElement('a');
        a.href = `/${sectionTitle.toLowerCase()}`;
        a.textContent = sectionTitle;
        const icon = document.createElement('span');
        icon.classList.add('icon', 'icon-arrow-down');
        navSection.addEventListener('mouseover', () => mouseOverMenu(a, block.parentNode));
        navSection.append(a);
        navSection.append(icon);
        return navSection;
      });
    // write the section menu
    if (sectionMenus.length) {
      sectionList.append(...sectionMenus);
    }

    // add event listeners
    // for desktop when clicking anywhere on the document
    document.addEventListener('click', closeMenuSection);
    document.addEventListener('mouseover', closeMenuSection);

    // for the hamburger toggle icon
    nav.querySelector('.hamburger-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        e.currentTarget.setAttribute('aria-expanded', 'false');
        document.querySelector('header nav').setAttribute('aria-expanded', 'false');
      } else {
        e.currentTarget.setAttribute('aria-expanded', 'true');
        document.querySelector('header nav').setAttribute('aria-expanded', 'true');
      }
    });

    // for the search toggle icon
    nav.querySelector('.search-label').addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        e.currentTarget.setAttribute('aria-expanded', 'false');
        document.querySelector('header nav .search .search-container').setAttribute('aria-expanded', 'false');
      } else {
        e.currentTarget.setAttribute('aria-expanded', 'true');
        document.querySelector('header nav .search .search-container').setAttribute('aria-expanded', 'true');
      }
    });

    // force hamburger close when in destop size
    MQ.addEventListener('change', () => {
      document.querySelector('header nav .hamburger-toggle').setAttribute('aria-expanded', 'false');

      // remove hard styled heights (from animations)
      document.querySelectorAll('header nav .sections ul').forEach((ul) => {
        ul.style.height = null;
      });
    });

    decorateIcons(nav);
    block.append(nav);
  }

  // load the content nav in the background with a small delay (only on desktop)
  if (MQ.matches) {
    setTimeout(() => {
      for (const section of ['focus', 'fitness', 'fuel', 'recover', 'magazine']) {
        buildSectionMenuContent(block.parentNode, section);
      }
    }, 500);
  }
}
