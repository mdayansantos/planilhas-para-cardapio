export function populateDays(days, daySelect) {
  daySelect.replaceChildren();
  for (const day of days) {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.append(option);
  }
}

export function renderMenu(menuData, daySelect, menuSummary, menuContent) {
  const dayIndex = menuData.days.indexOf(daySelect.value);
  const categories = menuData.categories.filter((category) => category.items[dayIndex]);
  const hasRestaurants = categories.some(({ restaurant }) => restaurant);
  const restaurantNames = hasRestaurants
    ? [...new Set(categories.map(({ restaurant }) => restaurant || 'Outros'))]
    : [];
  const categorySummary = `${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}`;
  const restaurantSummary = restaurantNames.length
    ? ` · ${restaurantNames.length} ${restaurantNames.length === 1 ? 'restaurante' : 'restaurantes'}`
    : '';
  menuSummary.textContent = `${categorySummary}${restaurantSummary} · ${daySelect.value}`;
  menuContent.replaceChildren();

  const categoryRows = [];
  const categoryRowsByName = new Map();
  for (const category of categories) {
    const categoryKey = normalize(category.name);
    let categoryRow = categoryRowsByName.get(categoryKey);
    if (!categoryRow) {
      categoryRow = { name: category.name, dishes: new Map() };
      categoryRowsByName.set(categoryKey, categoryRow);
      categoryRows.push(categoryRow);
    }

    const restaurant = hasRestaurants ? category.restaurant || 'Outros' : '';
    const dishes = categoryRow.dishes.get(restaurant) ?? [];
    dishes.push(...splitDishes(category.items[dayIndex]));
    categoryRow.dishes.set(restaurant, dishes);
  }

  const table = document.createElement('table');
  table.className = hasRestaurants ? 'menu-table has-restaurants' : 'menu-table';
  table.setAttribute('aria-describedby', 'menu-summary');

  const tableHead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const categoryHeader = document.createElement('th');
  categoryHeader.scope = 'col';
  categoryHeader.textContent = 'Categoria';
  headerRow.append(categoryHeader);

  if (hasRestaurants) {
    const restaurantColors = [
      '#b52f2f',
      '#7a4d2b',
      '#3d7f4e',
      '#4b577f',
      '#d9b431',
      '#c84b3d',
      '#5e8d51',
      '#8e4d77',
    ];

    restaurantNames.forEach((restaurant, index) => {
      const restaurantHeader = document.createElement('th');
      restaurantHeader.scope = 'col';
      restaurantHeader.className = 'restaurant-header';

      const badge = document.createElement('span');
      badge.className = 'restaurant-badge';
      badge.style.setProperty('--restaurant-bg', restaurantColors[index % restaurantColors.length]);
      badge.textContent = restaurant;
      restaurantHeader.append(badge);
      headerRow.append(restaurantHeader);
    });
  } else {
    const dayHeader = document.createElement('th');
    dayHeader.scope = 'col';
    dayHeader.textContent = daySelect.value;
    headerRow.append(dayHeader);
  }
  tableHead.append(headerRow);
  table.append(tableHead);

  const tableBody = document.createElement('tbody');
  for (const categoryRow of categoryRows) {
    const row = document.createElement('tr');
    const categoryCell = document.createElement('th');
    categoryCell.className = 'menu-category';
    categoryCell.scope = 'row';
    categoryCell.textContent = categoryRow.name;
    row.append(categoryCell);

    const columns = hasRestaurants ? restaurantNames : [''];
    for (const restaurant of columns) {
      const cell = document.createElement('td');
      const dishes = categoryRow.dishes.get(restaurant) ?? [];
      if (dishes.length) {
        cell.append(createDishList(dishes));
      } else {
        cell.className = 'menu-empty-cell';
        cell.textContent = '—';
      }
      row.append(cell);
    }
    tableBody.append(row);
  }

  if (categories.length === 0) {
    const row = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.className = 'menu-empty';
    emptyCell.colSpan = hasRestaurants ? restaurantNames.length + 1 : 2;
    emptyCell.textContent = `Nenhum prato cadastrado para ${daySelect.value}.`;
    row.append(emptyCell);
    tableBody.append(row);
  }

  table.append(tableBody);
  menuContent.append(table);
}

function createDishList(dishes) {
  const list = document.createElement('ul');
  list.className = 'dish-list';
  for (const dish of dishes) {
    const item = document.createElement('li');
    item.textContent = dish;
    list.append(item);
  }
  return list;
}

function splitDishes(value) {
  return value.split(';').map((dish) => dish.trim()).filter(Boolean);
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
