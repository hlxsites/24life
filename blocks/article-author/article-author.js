import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.innerHTML = '';

  const leftSide = document.createElement('div');
  leftSide.classList.add('brand');
  leftSide.append(createOptimizedPicture('https://main--24life--hlxsites.hlx.page/drafts/wingeier/media_12c56b7b5e58629e2664d39563b806731fcde3991.png'));
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
  authorLink.href = `/author/${toClassName(getMetadata('author'))}`;
  authorLink.innerText = getMetadata('author');
  authorName.append(authorLink);
  rightSide.append(authorName);

  const authorDescription = document.createElement('p');
  authorDescription.classList.add('author-description');
  authorDescription.innerText = ''; // show nothing while loading the description
  setTimeout(() => {
    // TODO: fetch author description from index
    authorDescription.innerText = 'TODO: fetch and replace description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies ultrices, nunc nisl aliquam nunc, quis aliquet nunc nisl eget elit.';
  }, 1000);
  rightSide.append(authorDescription);
  block.append(rightSide);
}
