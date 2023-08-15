export default function decorate(block) {
  const children = block.children;
  // first column
  if (children.length > 0) {
    children[0].classList.add('quote-text');
    if (children[0].children.length > 1) {
      children[0].children[0].remove();
    }
  }
  // second column
  if (children.length > 1) {
    children[1].classList.add('quote-author');
    if (children[1].children.length > 1) {
      children[1].children[0].remove();
    }
  }
}
