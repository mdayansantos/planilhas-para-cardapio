import * as XLSX from 'xlsx';
import { parseMenu, MENU_STORAGE_KEY } from './menu-data.js';
import './style.css';

const fileInput = document.querySelector('#file-input');
const fileName = document.querySelector('#file-name');
const message = document.querySelector('#message');

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  fileName.textContent = file.name;

  try {
    const workbook = XLSX.read(await file.arrayBuffer());
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('A planilha não tem nenhuma aba para ler.');
    }

    const menuData = parseMenu(workbook.Sheets[firstSheetName]);
    sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuData));
    window.location.assign(new URL('menu.html', window.location.href).href);
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : 'Não foi possível ler essa planilha.';
    message.className = 'message error';
  }
});
