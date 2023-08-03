import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.innerHTML = '';

  const leftSide = document.createElement('div');
  leftSide.classList.add('brand');
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
  authorLink.href = `/authors/${toClassName(getMetadata('author'))}`;
  authorLink.innerText = getMetadata('author');
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
        .find((author) => author.name.toLowerCase() === getMetadata('author').toLowerCase());
      if (authorInfo) {
        authorDescription.innerHTML = authorInfo.descriptionHtml;
        if (authorInfo.image) {
          leftSide.innerHTML = '';
          leftSide.append(createOptimizedPicture(authorInfo.image, authorInfo.name, false, [{ width: '300' }]));
        }
      }
    } else {
      console.log('Error fetching authors.json');
    }
  }, 1000);
  rightSide.append(authorDescription);
  block.append(rightSide);
}
