import {
  createOptimizedPicture, decorateIcons, toClassName,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const authorString = block.textContent.trim();
  block.innerHTML = '';

  const leftSide = document.createElement('div');
  leftSide.classList.add('author-image');
  block.append(leftSide);

  const rightSide = document.createElement('div');
  rightSide.classList.add('right-side');
  const authorTitle = document.createElement('p');
  authorTitle.classList.add('author-label');
  authorTitle.append('Author');
  rightSide.append(authorTitle);

  const authorName = document.createElement('p');
  authorName.classList.add('author-name');
  const authorLink = document.createElement('a');
  authorLink.href = `/author/${toClassName(authorString)}`;
  authorLink.innerText = authorString;
  authorName.append(authorLink);
  rightSide.append(authorName);

  const authorDescription = document.createElement('p');
  authorDescription.classList.add('author-description');
  authorDescription.innerText = ''; // show nothing while loading the description
  // delay the loading of the author description, as it's usually after the fold
  // and not an integral part of the first paint
  setTimeout(async () => {
    const resp = await fetch('/authors.json');
    if (resp.ok) {
      const json = await resp.json();
      const authorInfo = json.data
        .find((author) => author.name.toLowerCase() === authorString.toLowerCase());
      if (authorInfo) {
        authorDescription.innerText = authorInfo.description;
        if (authorInfo.image) {
          leftSide.innerHTML = '';
          leftSide.append(createOptimizedPicture(authorInfo.image, authorInfo.name, false, [{ width: '300' }]));
        }
        if (authorInfo.links) {
          addAuthorLinks(authorInfo, authorName);
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('Error fetching authors.json');
    }
  }, 500);
  rightSide.append(authorDescription);
  block.append(rightSide);
}

function addAuthorLinks(author, authorNameContainer) {
  const aLinks = author.links.split(',');
  const socialLinksContainer = document.createElement('div');
  socialLinksContainer.classList.add('social-links');
  function addSocialLink(socialLink) {
    socialLinksContainer.appendChild(socialLink);
  }
  aLinks.forEach((link) => {
    const socialLink = document.createElement('a');
    socialLink.href = link;
    socialLink.target = '_blank';
    if (link.includes('facebook')) {
      socialLink.innerHTML = '<span class="icon icon-facebook"></span>';
      addSocialLink(socialLink);
    } else if (link.includes('twitter')) {
      socialLink.innerHTML = '<span class="icon icon-twitter"></span>';
      addSocialLink(socialLink);
    } else if (link.includes('instagram')) {
      socialLink.innerHTML = '<span class="icon icon-instagram"></span>';
      addSocialLink(socialLink);
    }
    decorateIcons(socialLinksContainer);
  });
  authorNameContainer.after(socialLinksContainer);
}
