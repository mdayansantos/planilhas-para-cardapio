import * as XLSX from 'xlsx';
import { parseMenu } from './menu-data.js';
import './style.css';

const fileInput = document.querySelector('#file-input');
const fileName = document.querySelector('#file-name');
const message = document.querySelector('#message');
const uploadToken = document.querySelector('#upload-token');
const menuLink = document.querySelector('#menu-link');
const removeMenuButton = document.querySelector('#remove-menu');

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  fileName.textContent = file.name;
  menuLink.hidden = true;

  try {
    if (!uploadToken.value.trim()) {
      throw new Error('Informe a senha de publicação para enviar o cardápio.');
    }

    const workbook = XLSX.read(await file.arrayBuffer());
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('A planilha não tem nenhuma aba para ler.');
    }

    const menuData = parseMenu(workbook.Sheets[firstSheetName]);
    const response = await fetch('/api/menu', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uploadToken.value}`,
      },
      body: JSON.stringify(menuData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Não foi possível publicar o cardápio.');
    }

    message.textContent = 'Cardápio publicado. A tela da TV será atualizada automaticamente.';
    message.className = 'message success';
    menuLink.hidden = false;
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : 'Não foi possível ler essa planilha.';
    message.className = 'message error';
  }
});

removeMenuButton.addEventListener('click', async () => {
  if (!uploadToken.value.trim()) {
    message.textContent = 'Informe a senha de publicação para remover o cardápio.';
    message.className = 'message error';
    return;
  }
  if (!window.confirm('Remover o cardápio publicado? A tela da TV será atualizada em até 30 segundos.')) {
    return;
  }

  removeMenuButton.disabled = true;
  try {
    const response = await fetch('/api/menu', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${uploadToken.value}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Não foi possível remover o cardápio.');
    }

    message.textContent = 'Cardápio removido. A tela da TV será atualizada em até 30 segundos.';
    message.className = 'message success';
    menuLink.hidden = true;
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : 'Não foi possível remover o cardápio.';
    message.className = 'message error';
  } finally {
    removeMenuButton.disabled = false;
  }
});
