import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const currentIssue = document.createElement('div');
  currentIssue.className = 'current-issue';
  const otherIssues = document.createElement('div');
  otherIssues.className = 'other-issues';
  block.append(currentIssue);
  block.append(otherIssues);

  const magazines = await fetchMagazines();
  renderMagazines(magazines, currentIssue, otherIssues);
}

async function fetchMagazines() {
  const response = await fetch('/magazines.json');
  const json = await response.json();
  return json.data;
}

function renderMagazines(magazines, currentIssue, otherIssues) {
  magazines.forEach((issue, index) => {
    const issueDiv = document.createElement('div');
    issueDiv.className = 'issue';

    const issuePath = document.createElement('a');
    issuePath.href = issue.path;

    let issueImage;
    if (index === 0) {
      const imageSizes = [
        // when screen width is over 600px, image takes up 1/3 of the screen width.
        { media: '(min-width: 1200px)', width: '500' },
        { media: '(min-width: 900px)', width: '400' },
        { media: '(min-width: 600px)', width: '300' },
        // tablet and mobile sizes:
        { media: '(min-width: 400px)', width: '500' },
        { width: '400' },
      ];
      issueImage = createOptimizedPicture(issue.image, issue.title, true, imageSizes);
    } else {
      const imageSizes = [
        // when screen width is over 600px, image takes up 1/4 of the screen width.
        { media: '(min-width: 1200px)', width: '400' },
        { media: '(min-width: 900px)', width: '300' },
        { media: '(min-width: 600px)', width: '250' },
        // tablet and mobile sizes:
        { media: '(min-width: 400px)', width: '500' },
        { width: '400' },
      ];
      issueImage = createOptimizedPicture(issue.image, issue.title, false, imageSizes);
    }
    issueImage.className = 'issue-image';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'issue-title';
    titleDiv.textContent = issue.title;
    const titleLink = issuePath.cloneNode();
    titleLink.append(titleDiv);

    issuePath.append(issueImage);
    issueDiv.append(issuePath);
    issueDiv.append(titleLink);

    if (index === 0) {
      currentIssue.append(issueDiv);
    } else {
      otherIssues.append(issueDiv);
    }
  });
}
