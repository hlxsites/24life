function buildExploreCollectionsButton() {
  // Create a <div> element with class 'explore'
  const div = document.createElement('div');
  div.className = 'explore';

  // Create button
  const button = document.createElement('button');
  button.className = 'btn';
  button.onclick = () => window.open('/collections', '_blank');
  button.textContent = 'Collections';

  // Create a <span> element with class 'msg'
  const span = document.createElement('span');
  span.className = 'msg';
  span.textContent = 'Explore what interests you…';

  // Append <a> and <span> to <p>
  div.appendChild(button);
  div.appendChild(span);

  return div;
}

export default function decorate(block) {
  // When the links on the nested parentContainer are clicked,
  // background image of the parent parentContainer changes.
  const parentContainer = document.createElement('div');
  parentContainer.classList.add('container');
  const linksContainer = document.createElement('div');
  linksContainer.classList.add('links-container');
  parentContainer.append(linksContainer);

  // Select all links within the block
  const links = block.querySelectorAll('a');

  // Loop through each link
  links.forEach((link) => {
    // Find closest common parent (for example, a parentContainer)
    const parent = link.closest('div');

    // Find the image within that parent
    const img = parent ? parent.querySelector('img') : null;

    // default background image
    if (link.textContent?.toLowerCase().includes('yoga')) {
      parentContainer.style.backgroundImage = `url(${img.src})`;
    }

    // Add event listener for mouseover
    link.addEventListener('mouseover', () => {
      if (img) {
        parentContainer.style.backgroundImage = `url(${img.src})`;
      }
    });
  });

  const ul = document.createElement('ul');
  ul.classList.add('links');
  linksContainer.append(ul);
  // append links to ul
  for (const link of links) {
    const li = document.createElement('li');
    li.append(link);
    ul.append(li);
  }
  block.innerHTML = '';
  block.append(parentContainer);
  block.parentElement.prepend(buildExploreCollectionsButton());
}
