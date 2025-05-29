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

// Выбор персонажа (без Андрэ и Порье)
function renderCharacterSelection() {
  const filteredCharacters = data.characters.characters.filter(char => char.id !== 0 && char.id !== 4);
  const html = `
    <div class="container">
      <h2>Выберите персонажа</h2>
      ${filteredCharacters.map(char => `
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

  let extraButton = '';
  if (loc.title === "Коллегия магов") {
    extraButton = `<button class="button" onclick="openNewCharacters()">Персонажи</button>`;
  }

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
        ${index > 0 ? `<button class="button" onclick="renderLocation(${index-1})">Предыдущая локация</button>` : ''}
        ${index < data.locations.locations.length - 1 ? `<button class="button" onclick="renderLocation(${index+1})">Следующая локация</button>` : ''}
        <button class="button" onclick="renderMainMenu()">Главное меню</button>
      </div>
    </div>
  `;
}

// Открытие новых персонажей на локации "Коллегия магов"
function openNewCharacters() {
  const newChars = data.characters.characters.filter(c => c.id === 0 || c.id === 4); // Андрэ и Порье

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 95%; max-height: 95%;">
      <h2>Появились 2 новых персонажа</h2>
      <div id="new-characters-list"></div>
      <button class="button close-button" onclick="modal.remove()" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const container = modal.querySelector('#new-characters-list');
  container.innerHTML = '';

  newChars.forEach(char => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${char.name}</h3>
      <p><strong>Класс:</strong> ${char.class}</p>
      <p>${char.description.substring(0, 100)}...</p>
      <button class="button" onclick="switchCharacter(${char.id}, this)">Выбрать</button>
    `;
    container.appendChild(card);
  });
}

// Переключение персонажа
function switchCharacter(newCharId, btn) {
  const oldChar = {...selectedCharacter}; // Сохраняем старого персонажа
  const newChar = data.characters.characters.find(c => c.id === newCharId);

  // Удаляем старого персонажа из списка characters.json
  const index = data.characters.characters.findIndex(c => c.id === oldChar.id);
  if (index !== -1) {
    data.characters.characters.splice(index, 1);
  }

  // Добавляем его как нового
  data.characters.characters.push(oldChar);

  // Обновляем выбранный персонаж
  selectedCharacter = {...newChar};
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));

  // Обновляем интерфейс
  btn.closest('.card').remove();
  renderLocation(currentLocationIndex);
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
        <button class="button" onclick="addItem(inventoryItems)">Добавить</button>
      </div>
      <button class="button close-button" onclick="modal.remove()" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const listContainer = modal.querySelector('#inventory-list');
  renderInventoryList(inventoryItems, listContainer);

  modal.querySelector('button').onclick = () => {
    selectedCharacter.inventory = inventoryItems;
    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    modal.remove();
  };
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

function renderInventoryList(items, container) {
  container.innerHTML = '';
  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.marginBottom = '1rem';
    itemDiv.innerHTML = `
      <input type="text" value="${item}" oninput="items[${index}] = this.value" style="width: 80%; padding: 0.4rem;" />
      <button class="button delete-item-btn" onclick="items.splice(${index}, 1); renderInventoryList(items, this.closest('.modal-content').querySelector('#inventory-list'));">Удалить</button>
    `;
    container.appendChild(itemDiv);
  });
}

// Открытие заметок
function openNotes() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let notes = selectedCharacter.notes || [];

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Заметки</h3>
      <input type="text" id="note-input" placeholder="Введите заметку..." style="width: 90%; padding: 0.5rem; margin-bottom: 1rem;" />
      <button class="button" onclick="addNote(notes)">Добавить</button>
      <div id="notes-list" style="max-height: 300px; overflow-y: auto; margin-top: 1rem;"></div>
      <button class="button close-button" onclick="saveNotesAndClose(notes)" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const noteInput = modal.querySelector('#note-input');
  const listContainer = modal.querySelector('#notes-list');

  renderNotesList(notes, listContainer);

  modal.querySelector('button.close-button').onclick = () => {
    saveNotesAndClose(notes);
  };

  addNote = (notesArr) => {
    const text = noteInput.value.trim();
    if (text) {
      notesArr.push(text);
      noteInput.value = '';
      renderNotesList(notesArr, listContainer);
    }
  };
}

function renderNotesList(notes, container) {
  container.innerHTML = '';
  notes.forEach((note, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <textarea rows="2" style="width: 90%; padding: 0.4rem;">${note}</textarea>
      <button class="button delete-note-btn" onclick="notes.splice(${index}, 1); renderNotesList(notes, this.closest('#notes-list'));">Удалить</button>
    `;
    div.querySelector('textarea').oninput = (e) => {
      notes[index] = e.target.value;
    };
    container.appendChild(div);
  });
}

function saveNotesAndClose(notes) {
  selectedCharacter.notes = notes;
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  modal.remove();
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
