export default function decorate(block) {
  // The order of the block is expected to be the quote first, then the author
  const quoteRow = block.children[0];
  const authorRow = block.children[1];

  if (quoteRow) {
    quoteRow.classList.add('quote-text');
    if (quoteRow.children.length > 1) {
      quoteRow.children[0].remove();
    }
  }

  // author row is optional. Either the row or the value can be omitted.
  if (authorRow) {
    authorRow.classList.add('quote-author');
    if (authorRow.children[1]?.textContent.trim().length > 0) {
      authorRow.children[0].remove();
    } else {
      authorRow.remove();
    }
  }
}
