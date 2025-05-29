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
      ${data.characters.characters
        .filter(char => !['korgreyv', 'porje', 'andrey'].includes(char.id))
        .map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" onclick="showCharacterCard('${char.id}')"/>
          <h3>${char.name}</h3>
          <p><strong>Класс:</strong> ${char.class}</p>
          <button class="button" onclick="selectCharacter('${char.id}')">Выбрать</button>
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
  const character = data.characters.characters.find(c => c.id === id);
  if (!character) return;

  // Сохраняем выбранного персонажа
  selectedCharacter = JSON.parse(JSON.stringify(character));
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  localStorage.setItem('currentLocationIndex', 0);
  currentLocationIndex = 0;

  // Переход к первой локации
  renderLocation(currentLocationIndex);
}

// Локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  currentLocationIndex = index;
  localStorage.setItem('currentLocationIndex', index);

  document.body.style.background = loc.style.background || '#1e1e2f';
  document.body.style.color = loc.style.color || '#fff';

  const extraButton = index === 4 ? `<button class="button" onclick="showNewCharacters()">Персонажи</button>` : '';

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
          <button class="button" onclick="openNotes()">Заметки</button>
          ${extraButton}
        </div>
      </div>

      <!-- Навигация -->
      <div class="navigation-buttons">
        ${index > 0 ? `<button class="button" onclick="renderLocation(${index - 1})">Предыдущая локация</button>` : ''}
        ${index < data.locations.locations.length - 1 ? `<button class="button" onclick="renderLocation(${index + 1})">Следующая локация</button>` : ''}
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
      ${diceOptions.map(d => `<label><input type="checkbox" value="${d}"/> ${d}</label><br/>`).join('')}
      <button class="button" onclick="performRoll(this)">Бросить</button>
      <div id="dice-result"></div>
      <button class="button close-button" onclick="this.closest('.modal').style.display='none'" style="margin-top:1rem;">Закрыть</button>
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
      <div style="margin-top: 1rem;">
        <input type="text" id="new-item-input" placeholder="Новый предмет" style="width:70%; padding: 0.5rem;" />
        <button class="button" id="add-item-btn">Добавить</button>
      </div>
      <button class="button close-button" id="close-inventory-btn" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#inventory-list');
  renderInventoryList(inventoryItems, listContainer);

  modal.querySelector('#add-item-btn').onclick = () => {
    const input = modal.querySelector('#new-item-input');
    const newItem = input.value.trim();
    if (newItem !== '') {
      inventoryItems.push(newItem);
      input.value = '';
      renderInventoryList(inventoryItems, listContainer);
    }
  };

  modal.querySelector('#close-inventory-btn').onclick = () => {
    selectedCharacter.inventory = inventoryItems;
    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    modal.remove();
  };
}

function renderInventoryList(items, container) {
  container.innerHTML = '';
  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.marginBottom = '1rem';
    itemDiv.innerHTML = `
      <input type="text" value="${item}" style="width: 80%; padding: 0.4rem;" oninput="items[${index}] = this.value"/>
      <button class="button delete-item-btn" onclick="items.splice(${index}, 1); renderInventoryList(items, this.closest('.modal-content').querySelector('#inventory-list'))">Удалить</button>
    `;
    container.appendChild(itemDiv);
  });
}

// Заметки
function openNotes() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let notes = selectedCharacter.notes || [];

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Заметки</h3>
      <input type="text" id="note-input" placeholder="Введите заметку..." style="width:90%; padding:0.5rem; margin-bottom:1rem;" />
      <button class="button" id="add-note-btn">Добавить</button>
      <div id="notes-list" style="max-height: 300px; overflow-y: auto; margin-top: 1rem;"></div>
      <button class="button close-button" id="close-notes-btn" style="margin-top:1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#notes-list');
  const noteInput = modal.querySelector('#note-input');

  renderNotesList(notes, listContainer);

  modal.querySelector('#add-note-btn').onclick = () => {
    const text = noteInput.value.trim();
    if (text) {
      notes.push(text);
      noteInput.value = '';
      renderNotesList(notes, listContainer);
    }
  };

  modal.querySelector('#close-notes-btn').onclick = () => {
    selectedCharacter.notes = notes;
    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    modal.remove();
  };
}

function renderNotesList(notes, container) {
  container.innerHTML = '';
  notes.forEach((note, index) => {
    const noteDiv = document.createElement('div');
    noteDiv.style.marginBottom = '1rem';
    noteDiv.innerHTML = `
      <textarea rows="2" style="width:90%; padding:0.4rem;">${note}</textarea>
      <button class="button delete-note-btn" onclick="notes.splice(${index}, 1); renderNotesList(notes, this.closest('#notes-list'))">Удалить</button>
    `;
    noteDiv.querySelector('textarea').oninput = e => notes[index] = e.target.value;
    container.appendChild(noteDiv);
  });
}

// Открытие нового экрана с персонажами
function showNewCharacters() {
  const newChars = ['korgreyv', 'porje']
    .map(id => data.characters.characters.find(c => c.id === id))
    .filter(Boolean);

  const oldChar = selectedCharacter;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-height:90vh; overflow-y:auto;">
      <h3>Появились 2 новых персонажа</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${newChars.map(char => `
          <div class="card">
            <img src="images/${char.image}" class="character-image"/>
            <h3>${char.name}</h3>
            <p><strong>Класс:</strong> ${char.class}</p>
            <p>${char.description.substring(0, 100)}...</p>
            <button class="button" onclick="switchCharacter('${char.id}')">Выбрать</button>
          </div>
        `).join('')}
      </div>
      <button class="button close-button" onclick="this.closest('.modal').style.display='none'" style="margin-top:1rem;">Закрыть</button>
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
  localStorage.setItem('lastReplacedCharacterId', selectedCharacter.id);
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
