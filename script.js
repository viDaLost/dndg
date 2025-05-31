// script.js
const app = document.getElementById('app');
let selectedCharacter = null;
let currentLocationIndex = 0;
document.body.style.backgroundColor = '#808080';

// Загружаем данные
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

// Плавная анимация
function fadeTransition(callback) {
  app.style.opacity = 0;
  setTimeout(() => {
    callback();
    setTimeout(() => (app.style.opacity = 1), 50);
  }, 300);
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
        .filter(char => !['korgreyv', 'porje', 'andrey'].includes(char.id.toString()))
        .map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" loading="lazy" onclick="showCharacterCard('${char.id}')"/>
          <h3>${char.name}</h3>
          <p><strong>Класс:</strong> ${char.class}</p>
          <button class="button" onclick="selectCharacter('${char.id}')">Выбрать</button>
        </div>
      `).join('')}
    </div>
  `;
  app.innerHTML = html;
}

// Отображение локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  currentLocationIndex = index;
  localStorage.setItem('currentLocationIndex', index);

  const extraButton = index === 4 ? `<button class="button" onclick="showNewCharacters()">Персонажи</button>` : '';

  fadeTransition(() => {
    app.innerHTML = `
      <div class="container">
        <h1>${loc.title}</h1>
        <p>${loc.description}</p>
        <img src="images/${loc.image}" class="location-image" loading="lazy"/>

        <div class="card stats-card">
          <h3>Характеристики</h3>
          <div class="stats-grid" style="display:flex; flex-wrap:wrap;">
            ${Object.entries(selectedCharacter.stats).map(([k,v]) => `
              <div class="stat-box" style="width:45%;margin:2.5%;">
                <label>${k}</label>
                <input type="number" value="${v}" onchange="updateStat('${k}', this.value)" style="width:100%;"/>
              </div>
            `).join('')}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; margin-top:0.5rem;">
            <button class="button" onclick="showCharacterCard(selectedCharacter.id)">Карточка</button>
            <button class="button" onclick="rollDice()">Кости</button>
            <button class="button" onclick="openInventory()">Инвентарь</button>
            <button class="button" onclick="openNotes()">Заметки</button>
            ${extraButton}
          </div>
        </div>

        <div class="navigation-buttons" style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; margin-top:1rem;">
          ${index > 0 ? `<button class="button" onclick="renderLocation(${index - 1})">← Локация</button>` : ''}
          ${index < data.locations.locations.length - 1 ? `<button class="button" onclick="renderLocation(${index + 1})">→ Локация</button>` : ''}
          <button class="button" onclick="renderMainMenu()">Меню</button>
        </div>
      </div>
    `;
  });
}

// Обновление статов
function updateStat(stat, value) {
  selectedCharacter.stats[stat] = parseInt(value);
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
}

// Карточка персонажа
function showCharacterCard(id) {
  const char = data.characters.characters.find(c => c.id.toString() === id.toString());
  if (!char) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${char.name}</h2>
      <img src="images/${char.image}" class="character-image" loading="lazy"/>
      <p><strong>Класс:</strong> ${char.class}</p>
      <p><strong>Описание:</strong> ${char.description}</p>
      <h4>Характеристики:</h4>
      <ul>${Object.entries(char.stats).map(([k,v]) => `<li>${k}: ${v}</li>`).join('')}</ul>
      <h4>Инвентарь:</h4>
      <ul>${char.inventory.map(i => `<li>${i}</li>`).join('')}</ul>
      <h4>Способности:</h4>
      <ul>${char.abilities.map(a => `<li>${a}</li>`).join('')}</ul>
      <button class="button" onclick="this.closest('.modal').remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Показать выбор новых персонажей
function showNewCharacters() {
  const newChars = ['korgreyv', 'porje'].map(id => data.characters.characters.find(c => c.id === id)).filter(Boolean);
  const oldChar = structuredClone(selectedCharacter);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Выберите нового персонажа</h3>
      ${newChars.map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" loading="lazy"/>
          <h3>${char.name}</h3>
          <p><strong>Класс:</strong> ${char.class}</p>
          <p>${char.description.substring(0, 100)}...</p>
          <button class="button" onclick="replaceCharacter('${char.id}', ${JSON.stringify(oldChar).replace(/"/g, '&quot;')})">Выбрать</button>
        </div>
      `).join('')}
      <button class="button" onclick="this.closest('.modal').remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Замена персонажа
function replaceCharacter(newId, oldCharData) {
  const newChar = data.characters.characters.find(c => c.id === newId);
  if (!newChar) return;

  const index = data.characters.characters.findIndex(c => c.id === newId);
  data.characters.characters[index] = oldCharData;

  selectedCharacter = JSON.parse(JSON.stringify(newChar));
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));

  document.querySelector('.modal').remove();
  renderLocation(currentLocationIndex);
}

// Инвентарь
function openInventory() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let inventoryItems = [...selectedCharacter.inventory];

  function renderList() {
    const container = modal.querySelector('#inventory-list');
    container.innerHTML = inventoryItems.map((item, index) => `
      <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
        <input type="text" value="${item}" style="flex:1;" oninput="this.oninputHandler(event, ${index})"/>
        <button onclick="this.onclickHandler(${index})">Удалить</button>
      </div>
    `).join('');
    [...container.querySelectorAll('input')].forEach((el, i) => {
      el.oninputHandler = (e, idx) => inventoryItems[idx] = e.target.value;
    });
    [...container.querySelectorAll('button')].forEach((el, i) => {
      el.onclickHandler = (idx) => {
        inventoryItems.splice(idx, 1);
        renderList();
      };
    });
  }

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Инвентарь</h3>
      <div id="inventory-list" style="max-height:300px; overflow-y:auto;"></div>
      <input id="new-item-input" type="text" placeholder="Новый предмет" style="width:70%;"/>
      <button onclick="document.querySelector('#new-item-input').value && (inventoryItems.push(document.querySelector('#new-item-input').value), document.querySelector('#new-item-input').value = '', renderList())">Добавить</button>
      <button onclick="selectedCharacter.inventory = inventoryItems; localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter)); modal.remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  renderList();
}

// Заметки
function openNotes() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let notes = selectedCharacter.notes || [];

  function renderNotes() {
    const list = modal.querySelector('#notes-list');
    list.innerHTML = notes.map((note, i) => `
      <div>
        <textarea style="width:100%;">${note}</textarea>
        <button onclick="notes.splice(${i},1); renderNotes()">Удалить</button>
      </div>
    `).join('');
    [...list.querySelectorAll('textarea')].forEach((ta, i) => {
      ta.oninput = (e) => notes[i] = e.target.value;
    });
  }

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Заметки</h3>
      <input type="text" id="note-input" placeholder="Новая заметка" style="width:70%;"/>
      <button onclick="let val = document.querySelector('#note-input').value; if(val){notes.push(val); document.querySelector('#note-input').value=''; renderNotes();}">Добавить</button>
      <div id="notes-list" style="max-height:300px; overflow:auto; margin-top:1rem;"></div>
      <button onclick="selectedCharacter.notes = notes; localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter)); modal.remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  renderNotes();
}

// Кости
function rollDice() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  const diceOptions = ['D4','D6','D8','D10','D12','D20'];
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Выберите кости</h3>
      ${diceOptions.map(d => `<label><input type="checkbox" value="${d}"/> ${d}</label>`).join('<br/>')}
      <button onclick="performRoll(this)">Бросить</button>
      <div id="dice-result"></div>
      <button onclick="modal.remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

function performRoll(button) {
  const results = [...button.parentNode.querySelectorAll('input:checked')].map(inp => {
    const sides = parseInt(inp.value.slice(1));
    return `${inp.value}: ${Math.floor(Math.random()*sides)+1}`;
  });
  button.nextElementSibling.innerHTML = `<p>${results.join(', ')}</p>`;
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
