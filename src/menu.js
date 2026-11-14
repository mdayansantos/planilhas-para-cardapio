import { MENU_STORAGE_KEY } from './menu-data.js';
import { populateDays, renderMenu } from './menu-view.js';
import './style.css';

const menuSection = document.querySelector('#menu-section');
const emptyState = document.querySelector('#empty-state');
const emptyMessage = document.querySelector('#empty-message');
const daySelect = document.querySelector('#day-select');
const menuSummary = document.querySelector('#menu-summary');
const menuContent = document.querySelector('#menu-content');

try {
  const storedMenu = sessionStorage.getItem(MENU_STORAGE_KEY);
  if (!storedMenu) {
    showEmptyState('Selecione uma planilha na página de entrada para montar o cardápio.');
  } else {
    const menuData = JSON.parse(storedMenu);
    if (!menuData || !Array.isArray(menuData.days) || !Array.isArray(menuData.categories)) {
      throw new Error('Os dados do cardápio estão incompletos.');
    }

    populateDays(menuData.days, daySelect);
    renderMenu(menuData, daySelect, menuSummary, menuContent);
    daySelect.addEventListener('change', () =>
      renderMenu(menuData, daySelect, menuSummary, menuContent),
    );
    menuSection.hidden = false;
  }
} catch (error) {
  showEmptyState(error instanceof Error
    ? `Não foi possível abrir o cardápio: ${error.message}`
    : 'Não foi possível abrir o cardápio.');
}

function showEmptyState(message) {
  emptyMessage.textContent = message;
  emptyState.hidden = false;
}
