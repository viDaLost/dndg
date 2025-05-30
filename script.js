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
      <button class="styled-button" onclick="renderCharacterSelection()">Начать прохождение</button>
    </div>
  `;
}

// Выбор персонажа
function renderCharacterSelection() {
  const html = `
    <div class="container">
      <h2>Выберите персонажа</h2>
      ${data.characters.characters
        .filter(char => !['korgreyv', 'porje'].includes(char.id))
        .map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" onload="this.style.opacity=1;" />
          <h3>${char.name}</h3>
          <p><strong>Класс:</strong> ${char.class}</p>
          <button class="styled-button" onclick="selectCharacter('${char.id}')">Выбрать</button>
        </div>
      `).join('')}
    </div>
  `;
  app.innerHTML = html;
}

// Карточка персонажа
function showCharacterCard(id) {
  const char = data.characters.characters.find(c => c.id === id);
  if (!char) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${char.name}</h2>
      <img src="images/${char.image}" class="character-image loaded" />
      <p><strong>Класс:</strong> ${char.class}</p>
      <p><strong>Описание:</strong> ${char.description}</p>
      <h4>Характеристики:</h4>
      <ul>${Object.entries(char.stats).map(([k,v]) => `<li>${k}: ${v}</li>`).join('')}</ul>
      <h4>Инвентарь:</h4>
      <ul>${char.inventory.map(i => `<li>${i}</li>`).join('')}</ul>
      <h4>Способности:</h4>
      <ul>${char.abilities.map(a => `<li>${a}</li>`).join('')}</ul>
      <button class="styled-button close-modal-btn" onclick="this.closest('.modal').style.display='none'">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Выбор персонажа
function selectCharacter(id) {
  const character = data.characters.characters.find(c => c.id === id);
  if (!character) return;

  selectedCharacter = JSON.parse(JSON.stringify(character));
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  localStorage.setItem('currentLocationIndex', 0);
  currentLocationIndex = 0;

  renderLocation(currentLocationIndex);
}

// Локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  // Анимация
  app.classList.add('fade-out');

  setTimeout(() => {
    // Сохраняем индекс текущей локации
    currentLocationIndex = index;
    localStorage.setItem('currentLocationIndex', index);

    // Фиксируем фон приложения
    document.body.style.background = '#2e1f0f';
    document.body.style.color = '#f5f5dc';

    // Добавляем контент
    const extraButton = index === 4 ? `<button class="styled-button" onclick="showNewCharacters()">Персонажи</button>` : '';

    app.innerHTML = `
      <div class="container">
        <h1>${loc.title}</h1>
        <p>${loc.description}</p>

        <!-- Изображение локации -->
        <div class="image-container">
          <div class="loading-indicator">Загрузка...</div>
          <img src="images/${loc.image}" class="location-image" onload="this.previousElementSibling.style.display='none'; this.classList.add('loaded')" />
        </div>

        <!-- Характеристики -->
        <div class="card stats-card">
          <h3>Характеристики</h3>
          <div class="stats-grid">
            ${Object.entries(selectedCharacter.stats).map(([k,v], i) => `
              <div class="stat-box">
                <label>${k}</label>
                <input type="number" value="${v}" onchange="updateStat('${k}', this.value)" />
              </div>
              ${i % 4 === 3 ? '<br>' : ''}
            `).join('')}
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="action-buttons-row">
          <button class="styled-button action-btn" onclick="showCharacterCard(selectedCharacter.id)">Показать карточку</button>
          <button class="styled-button action-btn" onclick="rollDice()">Бросить кости</button>
          <button class="styled-button action-btn" onclick="openInventory()">Инвентарь</button>
          <button class="styled-button action-btn" onclick="openNotes()">Заметки</button>
        </div>

        <!-- Навигация -->
        <div class="navigation-buttons">
          ${index > 0 ? `<button class="styled-button nav-btn" onclick="renderLocation(${index - 1})">Предыдущая локация</button>` : ''}
          ${index < data.locations.locations.length - 1 ? `<button class="styled-button nav-btn" onclick="renderLocation(${index + 1})">Следующая локация</button>` : ''}
        </div>

        <!-- Главное меню -->
        <div class="main-menu-button">
          <button class="styled-button main-menu-btn" onclick="renderMainMenu()">Главное меню</button>
        </div>
      </div>
    `;

    // Анимация появления
    setTimeout(() => {
      app.classList.remove('fade-out');
      app.classList.add('fade-in');
    }, 10);
  }, 200);
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
      ${diceOptions.map(d => `<label><input type="checkbox" value="${d}"/> ${d}</label><br/>`).join('')}
      <button class="styled-button" onclick="performRoll(this)">Бросить</button>
      <div id="dice-result"></div>
      <button class="styled-button close-modal-btn" onclick="this.closest('.modal').style.display='none'" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

function performRoll(button) {
  const checked = document.querySelectorAll('input:checked');
  const results = Array.from(checked).map(input => {
    const sides = parseInt(input.value.replace('D', ''));
    return `${input.value}: ${Math.floor(Math.random() * sides) + 1}`;
  });
  button.nextElementSibling.innerHTML = `<p>Результат: ${results.join(', ')}</p>`;
}

// Инвентарь
function openInventory() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let inventoryItems = [...selectedCharacter.inventory];

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Инвентарь</h3>
      <div id="inventory-list" style="max-height: 300px; overflow-y: auto;"></div>
      <div class="input-group">
        <input type="text" id="new-item-input" placeholder="Новый предмет" class="item-input" />
        <button class="styled-button" onclick="addItem(inventoryItems)">Добавить</button>
      </div>
      <button class="styled-button close-modal-btn" onclick="closeModalAndSave(modal, inventoryItems)" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#inventory-list');
  renderInventoryList(inventoryItems, listContainer);
}

function renderInventoryList(items, container) {
  container.innerHTML = '';
  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.innerHTML = `
      <input type="text" value="${item}" onchange="items[${index}] = this.value" />
      <button class="styled-button small" onclick="removeItem(${index}, items, this.closest('.modal-content'))">Удалить</button>
    `;
    container.appendChild(itemDiv);
  });
}

function addItem(items) {
  const input = document.getElementById('new-item-input');
  const newItem = input.value.trim();
  if (newItem !== '') {
    items.push(newItem);
    input.value = '';
    renderInventoryList(items, document.getElementById('inventory-list'));
  }
}

function removeItem(index, items, modal) {
  items.splice(index, 1);
  renderInventoryList(items, modal.querySelector('#inventory-list'));
}

function closeModalAndSave(modal, items) {
  selectedCharacter.inventory = items;
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  modal.remove();
}

// Заметки
function openNotes() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let notes = selectedCharacter.notes || [];

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Заметки</h3>
      <div id="notes-list" style="max-height: 300px; overflow-y: auto;"></div>
      <div class="input-group">
        <input type="text" id="note-input" placeholder="Введите заметку..." class="item-input" />
        <button class="styled-button" onclick="addNote(notes, this.closest('.modal-content'))">Добавить</button>
      </div>
      <button class="styled-button close-modal-btn" onclick="this.closest('.modal').style.display='none'" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#notes-list');
  renderNotesList(notes, listContainer);

  modal.querySelector('.input-group .styled-button').onclick = () => {
    const text = modal.querySelector('#note-input').value.trim();
    if (text) {
      notes.push(text);
      modal.querySelector('#note-input').value = '';
      renderNotesList(notes, listContainer);
    }
  };
}

function renderNotesList(notes, container) {
  container.innerHTML = '';
  notes.forEach((note, index) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item';
    noteDiv.innerHTML = `
      <textarea rows="2" oninput="notes[${index}] = this.value">${note}</textarea>
      <button class="styled-button small" onclick="notes.splice(${index}, 1); renderNotesList(notes, this.closest('#notes-list'))">Удалить</button>
    `;
    container.appendChild(noteDiv);
  });
}

function addNote(notes, modal) {
  const input = modal.querySelector('#note-input');
  const text = input.value.trim();
  if (text) {
    notes.push(text);
    input.value = '';
    renderNotesList(notes, modal.querySelector('#notes-list'));
  }
}

// Открытие новых персонажей
function showNewCharacters() {
  const newChars = ['korgreyv', 'porje']
    .map(id => data.characters.characters.find(c => c.id === id))
    .filter(Boolean);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-height:90vh; overflow-y:auto;">
      <h3>Появились новые персонажи</h3>
      <div class="new-characters">
        ${newChars.map(char => `
          <div class="new-char-card">
            <div class="loading-indicator">Загрузка...</div>
            <img src="images/${char.image}" class="character-image" onload="this.previousElementSibling.style.display='none'; this.classList.add('loaded')" />
            <h3>${char.name}</h3>
            <p><strong>Класс:</strong> ${char.class}</p>
            <p>${char.description.substring(0, 100)}...</p>
            <button class="styled-button" onclick="switchCharacter('${char.id}')">Выбрать</button>
          </div>
        `).join('')}
      </div>
      <button class="styled-button close-modal-btn" onclick="this.closest('.modal').style.display='none'" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Смена персонажа
function switchCharacter(newCharId) {
  const newChar = data.characters.characters.find(c => c.id === newCharId);
  if (!newChar) return;

  selectedCharacter = newChar;
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));

  document.querySelector('.modal').style.display = 'none';
  renderLocation(currentLocationIndex);
}

// Инициализация
let data;
loadData().then(d => {
  data = d;

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
