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
    columnCollectionsBlock(block);
  }
}

function columnCollectionsBlock(block) {
  block.parentElement.classList.add('column-collections-parent');
  for (const row of block.children) {
    for (const cell of row.children) {
      if (cell.children.length !== 0) {
        const link = cell.querySelector('a');
        const image = cell.querySelector('picture');
        const h2 = document.createElement('h2');
        h2.classList.add('columns-img-header');
        h2.textContent = link.textContent;
        link.textContent = '';
        link.className = 'columns-collections-img-link';
        link.append(h2);
        link.append(image);

        cell.innerHTML = '';
        cell.append(link);
      }
    }
  }
}
