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

    const issueImage = createOptimizedPicture(issue.image, issue.title, true);
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
