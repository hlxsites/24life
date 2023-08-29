import { createOptimizedPicture, readBlockConfig, toClassName } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const data = readBlockConfig(block);
  const link = block.querySelector('a');
  block.innerText = '';

  const section = data?.section.trim();
  const title = data?.title.trim();
  const description = data?.description.trim();
  const authors = data?.authors.trim();

  // create left container
  const leftContainer = document.createElement('div');
  leftContainer.classList.add('left-container');
  // create image container
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');
  // create image
  imageContainer.append(createOptimizedPicture(
    data.image,
    data.article,
    true,
  ));
  leftContainer.append(imageContainer);

  // create article container
  const articleContainer = document.createElement('div');
  articleContainer.classList.add('article-container');
  // create h3
  const h3 = document.createElement('h3');
  h3.classList.add('article');
  h3.append(link);
  articleContainer.append(h3);

  // create p element for author
  const authorContainer = document.createElement('p');
  authorContainer.classList.add('author');
  authorContainer.append(createAuthorLink(authors));
  articleContainer.append(authorContainer);
  leftContainer.append(articleContainer);

  // create right container
  const rightContainer = document.createElement('div');
  rightContainer.classList.add('right-container');

  // create wrapper for section name, title, and description
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper');
  const h1 = document.createElement('h1');
  h1.classList.add('section-name');
  h1.append(section);
  wrapper.append(h1);

  // title
  const p = document.createElement('p');
  p.classList.add('title');
  p.append(title);
  wrapper.append(p);

  // description
  const p2 = document.createElement('p');
  p2.classList.add('description');
  p2.append(description);
  wrapper.append(p2);

  rightContainer.append(wrapper);

  block.append(leftContainer);
  block.append(rightContainer);
}

function createAuthorLink(authors) {
  const authorLinks = document.createElement('span');
  authorLinks.append('By ');
  authors.split(',').forEach((author, index) => {
    const authorLink = document.createElement('a');
    authorLink.href = `/author/${toClassName(author)}`;
    authorLink.textContent = author;
    if (index > 0) {
      authorLinks.append(' and ');
    }
    authorLinks.append(authorLink);
  });
  return authorLinks;
}
