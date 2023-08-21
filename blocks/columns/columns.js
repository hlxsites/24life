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
    // query anchor tags in the block
    const anchors = [...block.querySelectorAll('a')];
    anchors.forEach((anchor) => {
      const newH1 = document.createElement('h2');
      newH1.classList.add('columns-img-header');
      newH1.innerHTML = anchor.textContent.toUpperCase();
      anchor.text = '';
      anchor.append(newH1);

      const h1 = anchor.parentElement;
      const p = h1.nextElementSibling;
      anchor.append(p.querySelector('picture'));
      p.remove();
    });
  }
}
