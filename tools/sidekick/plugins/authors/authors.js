import { PLUGIN_EVENTS } from 'https://www.hlx.live/tools/sidekick/library/events/events.js';
// import { createOptimizedPicture, getMetadata } from '../../../../scripts/lib-franklin.js';

const selectedTags = [];

export async function decorate(container, ignored, query) {
  const data = await getAuthorData();

  const createMenuItems = () => {
    const filteredTags = getFilteredTags(data, query);
    return filteredTags.map((item) => {
      const isSelected = selectedTags.includes(item.tag);
      return `
        <sp-menu-item value="${item.name}" ${isSelected ? 'selected' : ''}>
          ${item.name}
        </sp-menu-item>
      `;
    }).join('');
  };

  const handleMenuItemClick = (e) => {
    const { value, selected } = e.target;
    if (selected) {
      const index = selectedTags.indexOf(value);
      if (index > -1) {
        selectedTags.splice(index, 1);
      }
    } else {
      selectedTags.push(value);
    }

    const selectedLabel = container.querySelector('.selectedLabel');
    selectedLabel.textContent = getSelectedLabel();
  };

  const handleCopyButtonClick = () => {
    navigator.clipboard.writeText(selectedTags.join(', '));
    container.dispatchEvent(
      new CustomEvent(PLUGIN_EVENTS.TOAST, {
        detail: { message: 'Copied Tags' },
      }),
    );
  };

  const menuItems = createMenuItems();
  const sp = /* html */`
    <sp-menu
      label="Select tags"
      selects="multiple"
      data-testid="taxonomy"
    >
      ${menuItems}
    </sp-menu>
    <sp-divider size="s"></sp-divider>
    <div class="footer">
      <span class="selectedLabel">${getSelectedLabel()}</span>
      <sp-action-button label="Copy" quiet>
        <sp-icon-copy slot="icon"></sp-icon-copy>
      </sp-action-button>
    </div>
  `;

  const spContainer = document.createElement('div');
  spContainer.classList.add('container');
  spContainer.innerHTML = sp;
  container.append(spContainer);

  const menuItemElements = spContainer.querySelectorAll('sp-menu-item');
  menuItemElements.forEach((item) => {
    item.addEventListener('click', handleMenuItemClick);
  });

  const copyButton = spContainer.querySelector('sp-action-button');
  copyButton.addEventListener('click', handleCopyButtonClick);
}

async function getAuthorData() {
  const resp = await ffetch('/authors.json?');
  if (resp.ok) {
    const json = await resp.json();
    return json.data;
  }
  throw new Error('Error fetching authors.json');
}

function getSelectedLabel() {
  return selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected` : 'No tags selected';
}

function getFilteredTags(data, query) {
  if (!query) {
    return data;
  }

  return data.filter((item) => item.tag.toLowerCase().includes(query.toLowerCase()));
}

export default {
  title: 'Tags',
  searchEnabled: true,
};
