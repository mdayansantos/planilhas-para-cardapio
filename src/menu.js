import { populateDays, renderMenu } from './menu-view.js';
import './style.css';

const menuSection = document.querySelector('#menu-section');
const emptyState = document.querySelector('#empty-state');
const emptyMessage = document.querySelector('#empty-message');
const daySelect = document.querySelector('#day-select');
const menuSummary = document.querySelector('#menu-summary');
const menuContent = document.querySelector('#menu-content');

let displayedMenu;

async function refreshMenu() {
  try {
    const response = await fetch('/api/menu', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Não foi possível carregar o cardápio.');
    }
    if (!result || !Array.isArray(result.days) || !Array.isArray(result.categories)) {
      throw new Error('Os dados do cardápio estão incompletos.');
    }
    const menuChanged = JSON.stringify(result) !== JSON.stringify(displayedMenu);
    if (!menuChanged && daySelect.value === getCurrentDay(displayedMenu.days)) return;

    displayedMenu = result;
    populateDays(displayedMenu.days, daySelect);
    daySelect.value = getCurrentDay(displayedMenu.days);
    renderMenu(displayedMenu, daySelect, menuSummary, menuContent);
    menuSection.hidden = false;
    emptyState.hidden = true;
  } catch (error) {
    if (displayedMenu) {
      console.error('Não foi possível atualizar o cardápio da TV.', error);
    } else {
      showEmptyState(error instanceof Error
        ? error.message
        : 'Não foi possível carregar o cardápio.');
    }
  }
}

void refreshMenu();
window.setInterval(() => void refreshMenu(), 30_000);

function showEmptyState(message) {
  emptyMessage.textContent = message;
  emptyState.hidden = false;
}

function getCurrentDay(days) {
  const today = normalize(new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
  }).format(new Date())).replace(/-feira$/, '');
  return days.find((day) => normalize(day).startsWith(today)) || days[0];
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
