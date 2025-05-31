const app = document.getElementById('app');
let selectedCharacter = null;
let currentLocationIndex = 0;
document.body.style.backgroundColor = '#808080';

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

// Выбор персонажа и переход к первой локации
function selectCharacter(id) {
  const character = data.characters.characters.find(c => c.id.toString() === id.toString());
  if (!character) return;

  selectedCharacter = JSON.parse(JSON.stringify(character));
  localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
  localStorage.setItem('currentLocationIndex', 0);
  currentLocationIndex = 0;

  renderLocation(currentLocationIndex);
}

// Отображение локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  currentLocationIndex = index;
  localStorage.setItem('currentLocationIndex', index);

  const extraButton = index === 4 ? `<button class="button small-button" onclick="showNewCharacters()">Персонажи</button>` : '';

  fadeTransition(() => {
    app.innerHTML = `
      <div class="container">
        <h1>${loc.title}</h1>
        <p>${loc.description}</p>
        <img src="images/${loc.image}" class="location-image" loading="lazy"/>

        <div class="card stats-card">
          <h3>Характеристики</h3>
          <div class="stats-grid">
            ${Object.entries(selectedCharacter.stats).map(([k,v]) => `
              <div class="stat-box">
                <label>${k}</label>
                <input type="number" value="${v}" onchange="updateStat('${k}', this.value)" />
              </div>
            `).join('')}
          </div>
        </div>

        <div class="action-buttons">
          <button class="button small-button" onclick="showCharacterCard(selectedCharacter.id)">Карточка</button>
          <button class="button small-button" onclick="rollDice()">Кости</button>
          <button class="button small-button" onclick="openInventory()">Инвентарь</button>
          <button class="button small-button" onclick="openNotes()">Заметки</button>
          ${extraButton}
        </div>

        <div class="navigation-buttons">
          ${index > 0 ? `<button class="button small-button" onclick="renderLocation(${index - 1})">← Локация</button>` : ''}
          ${index < data.locations.locations.length - 1 ? `<button class="button small-button" onclick="renderLocation(${index + 1})">→ Локация</button>` : ''}
        </div>
        <div style="text-align:center; margin-top: 0.5rem;">
          <button class="button small-button" onclick="renderMainMenu()">Главное меню</button>
        </div>
      </div>
    `;
  });
}

// Обновление характеристик
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
      <button class="button small-button" onclick="this.closest('.modal').remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Открытие новых персонажей
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
          <button class="button small-button" onclick="replaceCharacter('${char.id}', ${JSON.stringify(oldChar).replace(/"/g, '&quot;')})">Выбрать</button>
        </div>
      `).join('')}
      <button class="button small-button" onclick="this.closest('.modal').remove()">Закрыть</button>
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
