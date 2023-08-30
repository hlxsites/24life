export default function decorate(block) {
  // When the links on the nested parentContainer are clicked, background image of the parent parentContainer changes.
  const parentContainer = document.createElement('div');
  parentContainer.classList.add('container');
  const linksContainer = document.createElement('div');
  linksContainer.classList.add('links-container');
  parentContainer.append(linksContainer);

  // Select all links within the block
  const links = block.querySelectorAll('a');

  // Loop through each link
  links.forEach((link) => {
    // if link text is Yoga, then set background image to image found in the parent

    // Find closest common parent (for example, a parentContainer)
    const parent = link.closest('div');

    // Find the image within that parent
    const img = parent ? parent.querySelector('img') : null;
    if (link.textContent?.toLowerCase().includes('yoga')) {
      parentContainer.style.backgroundImage = `url(${img.src})`;
      parentContainer.style.transition = 'background-image 0.5s ease-in-out';
      parentContainer.style.backgroundSize = 'contain';
    }

    // Add event listener for mouseover
    link.addEventListener('mouseover', () => {
      if (img) {
        parentContainer.style.backgroundImage = `url(${img.src})`;
        parentContainer.style.transition = 'background-image 0.5s ease-in-out';
        parentContainer.style.backgroundSize = 'contain';
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
}
