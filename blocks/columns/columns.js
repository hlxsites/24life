export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (block.classList.contains('collections')) {
    block.parentElement.classList.add('column-collections-parent');
    // query anchor tags in the block and move the picture into the anchor
    const anchors = [...block.querySelectorAll('a')];
    anchors.forEach((anchor) => {
      const h2 = document.createElement('h2');
      h2.classList.add('columns-img-header');
      h2.textContent = anchor.textContent;
      anchor.textContent = '';
      anchor.append(h2);

      // get closest header tag and replace anchor with it
      const headerTag = anchor.closest('h1,h2,h3,h4,h5,h6');
      // get the sibling paragraph which contains the picture
      const p = headerTag.nextElementSibling;
      headerTag.replaceWith(anchor);
      anchor.append(p.querySelector('picture'));
      p.remove();
    });
  }
}
