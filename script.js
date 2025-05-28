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
      ${data.characters.map(char => `
        <div class="card">
          <img src="images/${char.image}" class="character-image" onclick="showCharacterCard(${char.id})"/>
          <h3>${char.name}</h3>
          <p>${char.class}</p>
          <button class="button" onclick="selectCharacter(${char.id})">Выбрать</button>
        </div>
      `).join('')}
    </div>
  `;
  app.innerHTML = html;
}

// Карточка персонажа
function showCharacterCard(id) {
  const char = data.characters.find(c => c.id === id);
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
  selectedCharacter = data.characters.find(c => c.id === id);
  renderLocation(currentLocationIndex);
}

// Локации
function renderLocation(index) {
  const loc = data.locations.locations[index];
  if (!loc) return;

  // Установка цветовой схемы
  document.body.style.background = loc.style.background;
  document.body.style.color = loc.style.color;

  app.innerHTML = `
    <div class="container">
      <h1>${loc.title}</h1>
      <p>${loc.description}</p>
      <img src="images/${loc.image}" class="location-image"/>

      <!-- Меню действий -->
      <div class="card" style="background:${loc.style.background}; border:1px solid ${loc.style.color}66; color:${loc.style.color}">
        <h3>Характеристики</h3>
        <div class="stats-grid">
          ${Object.entries(selectedCharacter.stats).map(([k,v]) => `
            <div class="stat-row">
              <label>${k}</label>
              <input type="number" value="${v}" onchange="updateStat('${k}', this.value)" 
                     style="background:${loc.style.background}; color:${loc.style.color}; border:1px solid ${loc.style.color}88; padding: 0.5rem; border-radius: 5px;"/>
            </div>
          `).join('')}
        </div>

        <button class="button small" onclick="showCharacterCard(selectedCharacter.id)">Показать карточку</button>
        <button class="button small" onclick="rollDice()">Бросить кости</button>
      </div>

      <!-- Навигация -->
      <div>
        ${index > 0 ? `<button class="button" onclick="renderLocation(${index-1})">← Предыдущая</button>` : ''}
        ${index < data.locations.locations.length - 1 ? `<button class="button" onclick="renderLocation(${index+1})">Следующая локация →</button>` : ''}
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
    <div class="modal-content" style="background:${document.body.style.background}; color:${document.body.style.color}">
      <h3>Выберите кости</h3>
      ${diceOptions.map(d => `
        <label><input type="checkbox" value="${d}"/> ${d}</label><br/>
      `).join('')}
      <button class="button" onclick="performRoll(this)">Бросить</button>
      <div id="dice-result"></div>
      <button class="button" onclick="this.closest('.modal').style.display='none'" style="margin-top: 1rem;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Результат броска костей
function performRoll(button) {
  const checked = document.querySelectorAll('input:checked');
  const results = Array.from(checked).map(input => {
    const sides = parseInt(input.value.replace('D', ''));
    return `${input.value}: ${Math.floor(Math.random() * sides) + 1}`;
  });

  button.nextElementSibling.innerHTML = `
    <p>Результат: ${results.join(', ')}</p>
  `;
}

// Инициализация
let data;
loadData().then(d => {
  data = d;
  renderMainMenu();
});
