// script.js — обновлённая версия

const APP = (() => {
  const app = document.getElementById('app');
  const btnHome = document.getElementById('btn-home');
  const toastEl = document.getElementById('toast');

  // ключи для localStorage
  const LS_SELECTED = 'selectedCharacter';
  const LS_LOCATION = 'currentLocationIndex';

  // состояние
  let data = { characters:null, locations:null };
  let selectedCharacter = null;
  let currentLocationIndex = 0;

  // базовый путь (работает и в корне, и в подпапке на GitHub Pages)
  const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.url)
    ? new URL('.', import.meta.url)
    : new URL('.', (document.currentScript && document.currentScript.src) || location.href);

  // загрузка JSON с проверкой
  async function fetchJSON(name) {
    const url = new URL(name, BASE_URL).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Файл не найден: ${url}`);
    return res.json();
  }

  // всплывающее сообщение
  const showToast = (msg, ms=1800) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    setTimeout(() => (toastEl.hidden = true), ms);
  };

  // сохранение состояния
  function saveState() {
    try {
      localStorage.setItem(LS_SELECTED, JSON.stringify(selectedCharacter));
      localStorage.setItem(LS_LOCATION, String(currentLocationIndex));
    } catch {}
  }

  // загрузка состояния
  function loadState() {
    try{
      const sc = localStorage.getItem(LS_SELECTED);
      const idx = localStorage.getItem(LS_LOCATION);
      if (sc && idx !== null){
        selectedCharacter = JSON.parse(sc);
        currentLocationIndex = parseInt(idx, 10) || 0;
      }
    }catch{}
  }

  // загрузка данных
  async function loadData() {
    renderLoading();
    try {
      const [characters, locations] = await Promise.all([
        fetchJSON('characters.json'),
        fetchJSON('locations.json')
      ]);
      data = { characters, locations };
      return true;
    } catch (e) {
      renderError(
        'Не удалось загрузить данные. Проверь, что файлы лежат рядом с index.html.',
        e.message
      );
      return false;
    }
  }

  // экран загрузки
  function renderLoading() {
    app.innerHTML = `<div class="card">Загрузка...</div>`;
  }

  // экран ошибки
  function renderError(message, detail='') {
    app.innerHTML = `
      <div class="card">
        <h2>Ошибка</h2>
        <p>${message}</p>
        ${detail ? `<p>${detail}</p>` : ''}
        <button class="button" id="retry">Повторить</button>
      </div>
    `;
    document.getElementById('retry')?.addEventListener('click', start);
  }

  // главное меню
  function renderMainMenu() {
    app.innerHTML = `
      <div class="card">
        <h1>Записки сумасшедшего</h1>
        <p>Помощник ведущего для D&D</p>
        <button class="button" id="start">Начать прохождение</button>
        <button class="button small" id="continue">Продолжить</button>
      </div>
    `;
    document.getElementById('start').addEventListener('click', () => {
      renderCharacterSelection();
    });
    document.getElementById('continue').addEventListener('click', () => {
      if (selectedCharacter) renderLocation(currentLocationIndex);
      else showToast('Нет сохранённого прогресса');
    });
  }

  // выбор персонажа
  function renderCharacterSelection() {
    const all = data.characters?.characters || [];
    const blacklist = new Set(['korgreyv','porje','andrey']);
    const list = all.filter(c => !blacklist.has(c.id?.toString()));

    app.innerHTML = `
      <div class="card">
        <h2>Выберите персонажа</h2>
        <div>${list.map(c => `
          <div class="card">
            <h3>${c.name}</h3>
            <p><strong>Класс:</strong> ${c.class}</p>
            <button class="button small" data-id="${c.id}">Выбрать</button>
          </div>`).join('')}</div>
      </div>
    `;
    app.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => selectCharacter(btn.dataset.id));
    });
  }

  // выбор персонажа
  function selectCharacter(id) {
    const character = data.characters.characters.find(c => String(c.id) === String(id));
    if (!character) return;
    selectedCharacter = JSON.parse(JSON.stringify(character));
    currentLocationIndex = 0;
    saveState();
    renderLocation(currentLocationIndex);
    showToast(`Выбран: ${character.name}`);
  }

  // отображение локации
  function renderLocation(index) {
    const loc = data.locations?.locations?.[index];
    if (!loc) return;
    currentLocationIndex = index;
    saveState();

    app.innerHTML = `
      <div class="card">
        <h2>${loc.title}</h2>
        <p>${loc.description}</p>
      </div>
      <div class="card">
        <h3>Действия</h3>
        <button class="button small" id="to-menu">Главное меню</button>
        ${ index>0 ? `<button class="button small" id="prev">Назад</button>` : '' }
        ${ index < data.locations.locations.length-1 ? `<button class="button small" id="next">Вперёд</button>` : '' }
      </div>
    `;
    document.getElementById('to-menu').addEventListener('click', renderMainMenu);
    document.getElementById('prev')?.addEventListener('click', ()=> renderLocation(index-1));
    document.getElementById('next')?.addEventListener('click', ()=> renderLocation(index+1));
  }

  // кнопка Домой в шапке
  btnHome.addEventListener('click', renderMainMenu);

  // старт приложения
  async function start() {
    loadState();
    const ok = await loadData();
    if (!ok) return;
    if (selectedCharacter) {
      renderLocation(currentLocationIndex);
    } else {
      renderMainMenu();
    }
  }

  return { start };
})();

APP.start();
