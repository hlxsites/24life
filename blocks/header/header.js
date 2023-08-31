import { readBlockConfig, decorateIcons, loadScript } from '../../scripts/lib-franklin.js';
// import { decorateLinks } from '../../scripts/scripts.js';

// media query match that indicates mobile/desktop switch
const MQ = window.matchMedia('(min-width: 992px)');
const ONCE = { once: true };

function toggleMenu(li, preventDefault, event) {
  const ul = li.querySelector(':scope > ul');
  if (preventDefault || (!MQ.matches && ul)) event.preventDefault();
  if (li.classList.contains('expand')) {
    // collapse
    if (!MQ.matches && ul) {
      requestAnimationFrame(() => {
        ul.style.height = `${ul.scrollHeight}px`;
        ul.addEventListener('transitionend', () => {
          ul.style.height = '0px';
          ul.addEventListener('transitionend', () => {
            ul.style.height = null;
            li.classList.remove('expand');
          }, ONCE);
        }, ONCE);
      });
    } else {
      li.classList.remove('expand');
    }
  } else {
    if (!MQ.matches && ul) {
      ul.style.height = `${ul.scrollHeight}px`;
      ul.addEventListener('transitionend', () => {
        ul.style.height = '100%';
      }, ONCE);
    } else {
      li.parentElement.querySelectorAll('.expand').forEach((expanded) => {
        expanded.classList.remove('expand');
      });
    }
    li.classList.add('expand');
  }
}

function buildSectionMenuContent(sectionMenu, navCta, menuBlock) {
  // per default the section menus are link-list
  // if there is at least one picture they will become image-list
  sectionMenu.classList.add('link-list');
  const content = document.createElement('ul');
  const [firstRow, ...flyoutSections] = menuBlock.children;
  const overviewLink = firstRow.querySelector('a');
  overviewLink.className = 'primary-link';
  overviewLink.textContent = 'Overview';
  const overviewLi = document.createElement('li');
  overviewLi.className = 'overview';
  overviewLi.append(overviewLink);

  const subSectionMenus = flyoutSections.map((section) => {
    const li = document.createElement('li');
    const ul = section.querySelector(':scope ul');
    li.append(ul);

    if (ul.querySelector('picture')) {
      sectionMenu.classList.remove('link-list');
      sectionMenu.classList.add('image-list');
    }

    const [title, subtitle] = section.querySelectorAll('p');
    if (subtitle) {
      subtitle.className = 'subtitle';
      li.prepend(subtitle);
    }
    if (title) {
      title.className = 'title';
      li.prepend(title);
      const titleLink = title.querySelector('a');
      if (titleLink) title.addEventListener('click', toggleMenu.bind(titleLink, li, false));
    }

    // find all links, first-of-type becomes .primary-link and wraps the picture if there is one
    li.querySelectorAll('a').forEach((link) => {
      if (link.matches(':first-of-type')) {
        const picture = link.parentElement.querySelector('picture');
        if (picture) {
          const clone = link.cloneNode(false);
          picture.replaceWith(clone);
          clone.append(picture);
          clone.tabIndex = -1;
        }
        link.className = 'primary-link button secondary cta';
      } else {
        link.className = 'button secondary cta';
      }
    });

    // normalize the li content: wrap orphan texts in <p>, remove <br>
    ul.querySelectorAll('li').forEach((child) => [...child.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const textContent = node.textContent.trim();
        if (textContent) {
          const p = document.createElement('p');
          p.textContent = textContent;
          node.replaceWith(p);
        } else {
          node.remove();
        }
      }
      if (node.nodeName === 'BR') node.remove();
    }));

    return li;
  });

  if (navCta) {
    const li = document.createElement('li');
    li.className = 'navigation-cta';
    li.innerHTML = navCta.innerHTML;
    subSectionMenus.push(li);
  }

  content.append(overviewLi, ...subSectionMenus);
  //decorateLinks(content);
  sectionMenu.append(content);
}

function toggleSectionMenu(sectionMenu, navCta, menuBlock, event) {
  if (!sectionMenu.querySelector(':scope > ul')) {
    buildSectionMenuContent(sectionMenu, navCta, menuBlock);
  }
  toggleMenu(sectionMenu, true, event);
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // not really needed
  const config = readBlockConfig(block);
  // clear the block
  block.textContent = '';

  // fetch nav content
  const navPath = config.nav;
  const resp = await fetch('nav2.plain.html');

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
            <input type="text" class="search-input" placeholder="TYPE HERE">
          </div>
        </div>
      </div>
    `;

    // fill in the content from nav doc
    // logo
    const logo = nav.querySelector('.logo');
    logo.append(navContent.children[0].querySelector('p:first-of-type > span'));
    /* const authoredLogoLink = navContent.children[0].querySelector('p:first-of-type > a');
    if (authoredLogoLink) {
      logo.title = authoredLogoLink.innerText;
      logo.href = authoredLogoLink.href;
    } */

    // vg_section
    //nav.querySelector('.vgsection').append(navContent.children[0].querySelector('p:nth-of-type(2)').textContent);
    // location
    //nav.querySelector('.location').append(navContent.children[0].querySelector('p:nth-of-type(3)').textContent);
    // tools
    nav.querySelector('.tools').prepend(navContent.children[1].querySelector('ul'));

    //const navCta = navContent.children[2];
    const sectionList = nav.querySelector('.sections .sections-list');

    // get through all section menus
    const sectionMenus = [...navContent.children[2].querySelectorAll('ul > li')].map((menuBlock, index) => {
      const navSection = document.createElement('li');
      navSection.className = 'section';
      if (index === 0) navSection.classList.add('color-focus');
      else if (index === 1) navSection.classList.add('color-fitness');
      else if (index === 2) navSection.classList.add('color-fuel');
      else if (index === 3) navSection.classList.add('color-recover');
      else if (index === 4) navSection.classList.add('color-magazine');
      const sectionTitle = menuBlock.firstElementChild.textContent;
      const a = document.createElement('a');
      a.href = sectionTitle.toLowerCase();
      a.textContent = sectionTitle;
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-arrow-down');
      navSection.addEventListener('click', toggleSectionMenu.bind(a, navSection, menuBlock));
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
    document.addEventListener('click', (event) => {
      if (!sectionList.contains(event.target)) {
        const openItem = sectionList.querySelector('.section .expand');
        if (openItem) {
          toggleMenu(openItem, false, event);
        }
      }
    });

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
      document.querySelectorAll('header nav .sections .expand').forEach((el) => el.classList.remove('expand'));
      // remove hard styled heights (from animations)
      document.querySelectorAll('header nav .sections ul').forEach((ul) => {
        ul.style.height = null;
      });
    });

    /* set volvo icon */
    decorateIcons(nav);
    /* append result */
    block.append(nav);
  }
}
