import ffetch from '../../scripts/ffetch.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const currentIssue = document.createElement('div');
  currentIssue.className = 'current-issue';
  const otherIssues = document.createElement('div');
  otherIssues.className = 'other-issues';
  block.append(currentIssue);
  block.append(otherIssues);
  await fetchMagazines(currentIssue, otherIssues);
}

async function fetchMagazines(currentIssue, otherIssues) {
  const magazines = await ffetch('/magazines.json').all();

  await Promise.all(magazines
    .map(async (issue) => {
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

      if (currentIssue.children.length === 0) {
        currentIssue.append(issueDiv);
      } else {
        otherIssues.append(issueDiv);
      }

      issueDiv.addEventListener('mouseenter', (e) => {
        titleDiv.style.display = 'flex';
      });
      issueDiv.addEventListener('mouseleave', (e) => {
        titleDiv.style.display = 'none';
      });
    }));
}
