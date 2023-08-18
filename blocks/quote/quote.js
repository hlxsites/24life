export default function decorate(block) {
  // The order of the block is expected to be the quote first, then the author
  const quoteChild = block.children[0];
  const authorChild = block.children[1];

  if (quoteChild) {
    quoteChild.classList.add('quote-text');
    if (quoteChild.children.length > 1) {
      quoteChild.children[0].remove();
    }
  }

  if (authorChild) {
    authorChild.classList.add('quote-author');
    if (authorChild.children.length > 1) {
      authorChild.children[0].remove();
    }
  }
}
