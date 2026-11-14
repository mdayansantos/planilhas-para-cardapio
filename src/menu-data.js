import * as XLSX from 'xlsx';

export const MENU_STORAGE_KEY = 'weekly-menu';

export function parseMenu(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
  const headerIndex = rows.findIndex((row) =>
    row.some((value) => normalize(value) === 'categoria'),
  );

  if (headerIndex < 0) {
    throw new Error('Não encontrei a coluna "Categoria". Confira o formato da planilha.');
  }

  const headers = rows[headerIndex].map((value) => String(value).trim());
  const categoryIndex = headers.findIndex((value) => normalize(value) === 'categoria');
  const restaurantIndex = headers.findIndex((value) =>
    ['restaurante', 'restaurantes'].includes(normalize(value)),
  );
  const dayColumns = headers
    .map((value, index) => ({ name: value, index }))
    .filter(({ name, index }) =>
      name && index !== categoryIndex && index !== restaurantIndex,
    );
  const days = dayColumns.map(({ name }) => name);

  if (days.length === 0) {
    throw new Error('Não encontrei os dias nas colunas da planilha.');
  }

  let currentRestaurant = '';
  const categories = rows.slice(headerIndex + 1).reduce((result, row) => {
    const restaurant = restaurantIndex < 0
      ? ''
      : String(row[restaurantIndex] ?? '').trim();
    if (restaurant) currentRestaurant = restaurant;

    const category = {
      restaurant: restaurantIndex < 0 ? '' : currentRestaurant,
      name: String(row[categoryIndex] ?? '').trim(),
      items: dayColumns.map(({ index }) => String(row[index] ?? '').trim()),
    };

    if (category.name && category.items.some(Boolean)) result.push(category);
    return result;
  }, []);

  if (categories.length === 0) {
    throw new Error('A planilha tem cabeçalhos, mas não encontrei pratos cadastrados.');
  }

  return { days, categories };
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
