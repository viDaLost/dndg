const app = document.getElementById('app');
let selectedCharacter = null;
let currentLocationIndex = 0;

// Загрузка данных
async function loadData() {
  const [charsRes, locsRes] = await Promise.all([
    fetch('characters.json'),
    fetch('locations.json')
  ]);
  return {
    characters: await charsRes.json(),
    locations: await locsRes.json()
  };
}

// Главное меню
function renderMainMenu() {
  app.innerHTML = `
    <div class="container" style="text-align:center;">
      <h1>Записки сумасшедшего</h1>
      <button class="button" onclick="renderCharacterSelection()">Начать прохождение</button>
    </div>
  `;
}

// Выбор персонажа
function renderCharacterSelection() {
  const html = `
    <div class="container">
      <h2>Выберите персонажа</h2>
      ${data.characters.characters.map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" onclick="showCharacterCard(${char.id})"/>
          <h3>${char.name}</h3>
          <p><strong>Класс:</strong> ${char.class}</p>
          <button class="button" onclick="selectCharacter(${char.id})">Выбрать</button>
        </div>
      `).join('')}
    </div>
  `;
  app.innerHTML = html;
}

// Карточка персонажа
function showCharacterCard(id) {
  const char = data.characters.characters.find(c => c.id === id);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${char.name}</h2>
      <img src="images/${char.image}" class="character-image"/>
      <p><strong>Класс:</strong> ${char.class}</p>
      <p><strong>Описание:</strong> ${char.description}</p>
      <h4>Характеристики:</h4>
      <ul>${Object.entries(char.stats).map(([k,v]) => `<li>${k}: ${v}</li>`).join('')}</ul>
      <h4>Инвентарь:</h4>
      <ul>${char.inventory.map(i => `<li>${i}</li>`).join('')}</ul>
      <h4>Способности:</h4>
      <ul>${char.abilities.map(a => `<li>${a}</li>`).join('')}</ul>
      <button class="button" onclick="this.closest('.modal').style.display='none'">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Выбор персонажа
function selectCharacter(id) {
  selectedCharacter = JSON.parse(JSON.stringify(data.characters.characters.find(c => c.id === id)));
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  localStorage.setItem('currentLocationIndex', 0);
  currentLocationIndex = 0;
  renderLocation(currentLocationIndex);
}

// Локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  // Сохраняем индекс текущей локации
  currentLocationIndex = index;
  localStorage.setItem('currentLocationIndex', index);

  document.body.style.background = loc.style.background || '#1e1e2f';
  document.body.style.color = loc.style.color || '#fff';

  app.innerHTML = `
    <div class="container">
      <h1>${loc.title}</h1>
      <p>${loc.description}</p>
      <img src="images/${loc.image}" class="location-image"/>

      <!-- Меню действий -->
      <div class="card stats-card">
        <h3>Характеристики</h3>
        <div class="stats-grid">
          ${Object.entries(selectedCharacter.stats).map(([k,v]) => `
            <div class="stat-box">
              <label>${k}</label>
              <input type="number" value="${v}" onchange="updateStat('${k}', this.value)"/>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 1rem; display:flex; gap: 1rem; flex-wrap: wrap;">
          <button class="button" onclick="showCharacterCard(selectedCharacter.id)">Показать карточку</button>
          <button class="button" onclick="rollDice()">Бросить кости</button>
          <button class="button" onclick="openInventory()">Инвентарь</button>
        </div>
      </div>

      <!-- Навигация -->
      <div class="navigation-buttons">
        ${index > 0 ? `<button class="button" onclick="renderLocation(${index-1})">Предыдущая локация</button>` : ''}
        ${index < data.locations.locations.length - 1 ? `<button class="button" onclick="renderLocation(${index+1})">Следующая локация</button>` : ''}
        <button class="button" onclick="renderMainMenu()">Главное меню</button>
      </div>
    </div>
  `;
}

// Обновление характеристик
function updateStat(statName, value) {
  selectedCharacter.stats[statName] = parseInt(value);
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
}

// Бросок костей
function rollDice() {
  const diceOptions = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Выберите кости</h3>
      ${diceOptions.map(d => `
        <label><input type="checkbox" value="${d}"/> ${d}</label><br/>
      `).join('')}
      <button class="button" onclick="performRoll(this)">Бросить</button>
      <div id="dice-result"></div>
      <button class="button close-button" onclick="this.closest('.modal').style.display='none'" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

function performRoll(button) {
  const checked = document.querySelectorAll('input:checked');
  const results = Array.from(checked).map(input => {
    const sides = parseInt(input.value.replace('D', ''));
    return ` ${input.value}: ${Math.floor(Math.random() * sides) + 1}`;
  });
  button.nextElementSibling.innerHTML = `<p>Результат: ${results.join(', ')}</p>`;
}

// Открытие инвентаря
function openInventory() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let inventoryItems = [...selectedCharacter.inventory];

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Инвентарь</h3>
      <div id="inventory-list" style="max-height: 300px; overflow-y: auto;"></div>
      <div style="margin-top: 1rem;">
        <input type="text" id="new-item-input" placeholder="Новый предмет" style="width:70%; padding: 0.5rem;" />
        <button class="button" id="add-item-btn">Добавить</button>
      </div>
      <button class="button close-button" id="close-inventory-btn" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#inventory-list');
  renderInventoryList(inventoryItems, listContainer);

  // Добавление нового предмета
  modal.querySelector('#add-item-btn').onclick = () => {
    const input = modal.querySelector('#new-item-input');
    const newItem = input.value.trim();
    if (newItem !== '') {
      inventoryItems.push(newItem);
      input.value = '';
      renderInventoryList(inventoryItems, listContainer);
    }
  };

  // Закрытие окна и сохранение
  modal.querySelector('#close-inventory-btn').onclick = () => {
    selectedCharacter.inventory = inventoryItems;
    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    modal.remove();
  };
}

// Отрисовка списка инвентаря
function renderInventoryList(items, container) {
  container.innerHTML = '';
  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.marginBottom = '0.5rem';
    itemDiv.innerHTML = `
      <input type="text" value="${item}" style="width: 80%; padding: 0.4rem;" />
      <button class="button delete-item-btn">Удалить</button>
    `;
    container.appendChild(itemDiv);

    // Удаление предмета
    itemDiv.querySelector('.delete-item-btn').onclick = () => {
      items.splice(index, 1);
      renderInventoryList(items, container);
    };

    // Обновление предмета
    itemDiv.querySelector('input').oninput = (e) => {
      items[index] = e.target.value;
    };
  });
}

// Инициализация
let data;
loadData().then(d => {
  data = d;

  // Восстановление состояния
  const savedChar = localStorage.getItem('selectedCharacter');
  const savedIndex = localStorage.getItem('currentLocationIndex');

  if (savedChar && savedIndex !== null) {
    selectedCharacter = JSON.parse(savedChar);
    currentLocationIndex = parseInt(savedIndex);
    renderLocation(currentLocationIndex);
  } else {
    renderMainMenu();
  }
});
