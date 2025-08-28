/* script.js — модульная версия с улучшенной UX и мобильной адаптацией */
const APP = (() => {
  const app = document.getElementById('app');
  const btnHome = document.getElementById('btn-home');
  const toastEl = document.getElementById('toast');

  // ---- Константы ключей ----
  const LS_SELECTED = 'selectedCharacter';
  const LS_LOCATION = 'currentLocationIndex';

  // ---- Состояние ----
  let data = { characters:null, locations:null };
  let selectedCharacter = null;
  let currentLocationIndex = 0;

  // ---- Утилиты ----
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const showToast = (msg, ms=1800) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    setTimeout(() => (toastEl.hidden = true), ms);
  };

  const safeGet = (obj, path, def=undefined) =>
    path.split('.').reduce((o,k)=> (o && k in o ? o[k] : def), obj);

  const imageFallback = (imgEl, fall='images/placeholder.webp') => {
    imgEl.addEventListener('error', () => {
      if (imgEl.dataset.fallbackApplied) return;
      imgEl.dataset.fallbackApplied = '1';
      imgEl.src = fall;
    });
  };

  // ---- Хранилище ----
  const saveState = () => {
    try {
      localStorage.setItem(LS_SELECTED, JSON.stringify(selectedCharacter));
      localStorage.setItem(LS_LOCATION, String(currentLocationIndex));
    } catch {}
  };

  const loadState = () => {
    try{
      const sc = localStorage.getItem(LS_SELECTED);
      const idx = localStorage.getItem(LS_LOCATION);
      if (sc && idx !== null){
        selectedCharacter = JSON.parse(sc);
        currentLocationIndex = parseInt(idx, 10) || 0;
      }
    }catch{}
  };

  // ---- Загрузчик данных ----
  async function loadData() {
    renderLoading();
    try {
      const [charsRes, locsRes] = await Promise.all([
        fetch('characters.json', {cache:'no-store'}),
        fetch('locations.json', {cache:'no-store'})
      ]);

      if (!charsRes.ok || !locsRes.ok) throw new Error('Ошибка загрузки JSON');
      const characters = await charsRes.json();
      const locations = await locsRes.json();
      data = { characters, locations };
      return true;
    } catch (e) {
      renderError(
        'Не удалось загрузить данные. Проверьте подключение или файлы characters.json / locations.json.',
        e?.message || ''
      );
      return false;
    }
  }

  // ---- Рендеры служебные ----
  function renderLoading() {
    app.innerHTML = `
      <div class="container">
        <div class="card skeleton" style="height:140px"></div>
        <div class="grid-cards">
          <div class="card skeleton" style="height:220px"></div>
          <div class="card skeleton" style="height:220px"></div>
        </div>
      </div>
    `;
  }

  function renderError(message, detail='') {
    app.innerHTML = `
      <div class="container">
        <div class="card">
          <h2>Упс…</h2>
          <p>${message}</p>
          ${detail ? `<p class="muted">Детали: ${detail}</p>` : ''}
          <button class="button" id="retry">Повторить</button>
        </div>
      </div>
    `;
    document.getElementById('retry')?.addEventListener('click', start);
  }

  // ---- Переход экрана ----
  async function transitionIn() {
    app.classList.add('view-enter');
    await sleep(0);
    app.classList.add('view-enter-active');
    await sleep(250);
    app.classList.remove('view-enter','view-enter-active');
  }

  // ---- МОДАЛКА ----
  function openModal(contentNode) {
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `<div class="modal-content" role="dialog" aria-modal="true"></div>`;
    modal.querySelector('.modal-content').appendChild(contentNode);

    function close() {
      modal.classList.remove('open');
      setTimeout(()=> modal.remove(), 150);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e){ if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    modal.addEventListener('click', (e)=> { if (e.target === modal) close(); });

    document.body.appendChild(modal);
    // фокус-трап
    const focusables = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    focusables[0]?.focus();
    return { close, modal };
  }

  // ---- Главный экран ----
  async function renderMainMenu() {
    app.innerHTML = `
      <div class="container">
        <div class="card center">
          <h1 style="margin:.2rem 0 0.6rem">Записки сумасшедшего</h1>
          <p class="muted">Однопользовательский помощник ведущего для вашей кампании D&D</p>
          <div style="display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap; margin-top:.5rem">
            <button class="button" id="start">Начать прохождение</button>
            <button class="button ghost" id="continue">Продолжить</button>
          </div>
        </div>
        <div class="grid-cards">
          <div class="card">
            <h3>Советы</h3>
            <ul style="margin:.25rem 0 .25rem 1rem">
              <li>Долгое удержание на карточке персонажа — быстрый просмотр.</li>
              <li>Характеристики сохраняются автоматически.</li>
              <li>Используйте «Кости» для множественных бросков и сумм.</li>
            </ul>
          </div>
          <div class="card">
            <h3>Подсказки мастеру</h3>
            <p class="muted">Добавляйте заметки и предметы, переключайтесь между локациями, открывайте новых персонажей в особых местах.</p>
          </div>
        </div>
      </div>
    `;
    document.getElementById('start').addEventListener('click', renderCharacterSelection);
    document.getElementById('continue').addEventListener('click', () => {
      if (selectedCharacter) renderLocation(currentLocationIndex);
      else showToast('Нет сохранённого прогресса');
    });
    await transitionIn();
  }

  // ---- Выбор персонажа ----
  function renderCharacterSelection() {
    const all = safeGet(data,'characters.characters',[]) || [];
    const blacklist = new Set(['korgreyv','porje','andrey']);
    const list = all.filter(c => !blacklist.has(c.id?.toString()));

    app.innerHTML = `
      <div class="container">
        <div class="card center"><h2>Выберите персонажа</h2></div>
        <div class="grid-cards" id="char-grid"></div>
      </div>
    `;

    const grid = document.getElementById('char-grid');

    list.forEach(char => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="images/${char.image}" class="character-image" alt="Персонаж ${char.name}" loading="lazy">
        <h3>${char.name}</h3>
        <p class="muted"><strong>Класс:</strong> ${char.class}</p>
        <div style="display:flex; gap:.5rem; flex-wrap:wrap">
          <button class="button small" data-action="select" data-id="${char.id}">Выбрать</button>
          <button class="button small ghost" data-action="view" data-id="${char.id}">Карточка</button>
        </div>
      `;
      const img = card.querySelector('img');
      imageFallback(img);
      grid.appendChild(card);
    });

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = String(btn.dataset.id);
      if (btn.dataset.action === 'select') selectCharacter(id);
      if (btn.dataset.action === 'view') showFullCharacterInfo(id);
    });

    await transitionIn();
  }

  function showFullCharacterInfo(id) {
    const char = data.characters.characters.find(c => String(c.id) === String(id));
    if (!char) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h2 style="margin-top:0">${char.name}</h2>
      <img src="images/${char.image}" class="character-image" alt="${char.name}">
      <p><strong>Класс:</strong> ${char.class}</p>
      <p><strong>Описание:</strong> ${char.description}</p>
      <h4>Характеристики</h4>
      <ul>${Object.entries(char.stats).map(([k,v])=>`<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>
      <h4>Инвентарь</h4>
      <ul>${char.inventory.map(i=>`<li>${i}</li>`).join('')}</ul>
      <div style="display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.5rem">
        <button class="button small" id="pick">Выбрать</button>
        <button class="button small ghost" id="close">Закрыть</button>
      </div>
    `;
    const { close, modal } = openModal(wrap);
    imageFallback(modal.querySelector('img'));
    wrap.querySelector('#close').addEventListener('click', close);
    wrap.querySelector('#pick').addEventListener('click', () => { selectCharacter(char.id); close(); });
  }

  function selectCharacter(id) {
    const character = data.characters.characters.find(c => String(c.id) === String(id));
    if (!character) return;
    selectedCharacter = JSON.parse(JSON.stringify(character));
    currentLocationIndex = 0;
    saveState();
    renderLocation(currentLocationIndex);
    showToast(`Выбран: ${character.name}`);
  }

  // ---- Локация ----
  function renderLocation(index) {
    const loc = safeGet(data, 'locations.locations', [])[index];
    if (!loc) return;

    currentLocationIndex = index;
    saveState();

    const showNewButton = loc.title.toLowerCase().includes('коллегия магов');

    app.innerHTML = `
      <div class="container">
        <div class="card">
          <h2 style="margin:.1rem 0 .5rem">${loc.title}</h2>
          <p class="muted">${loc.description}</p>
          <img src="images/${loc.image}" class="location-image" alt="${loc.title}" loading="lazy">
        </div>

        <div class="card">
          <h3>Характеристики</h3>
          <div class="stats-grid" id="stats"></div>
        </div>

        <div class="actions">
          <button class="button small" id="btn-card">Карточка</button>
          <button class="button small" id="btn-dice">Кости</button>
          <button class="button small" id="btn-inv">Инвентарь</button>
          <button class="button small" id="btn-notes">Заметки</button>
          ${ showNewButton ? `<button class="button small" id="btn-newch">Показать персонажей</button>` : '' }
        </div>

        <div class="nav">
          ${ index>0 ? `<button class="button small" id="prev">← Предыдущая</button>` : '' }
          ${ index < data.locations.locations.length-1 ? `<button class="button small" id="next">Следующая →</button>` : '' }
          <button class="button small ghost" id="to-menu">Главное меню</button>
        </div>
      </div>
    `;

    const img = app.querySelector('img.location-image');
    imageFallback(img);

    // рендер статов с дебаунсом
    const statsWrap = document.getElementById('stats');
    const entries = Object.entries(selectedCharacter.stats || {});
    entries.forEach(([k, v]) => {
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.innerHTML = `
        <label>${k}</label>
        <input class="number" type="number" inputmode="numeric" value="${Number(v) || 0}" data-stat="${k}">
      `;
      statsWrap.appendChild(box);
    });

    let saveTimer;
    statsWrap.addEventListener('input', (e)=>{
      const input = e.target.closest('input[data-stat]');
      if (!input) return;
      const key = input.dataset.stat;
      const val = parseInt(input.value, 10) || 0;
      selectedCharacter.stats[key] = val;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(()=> { saveState(); showToast('Сохранено'); }, 300);
    });

    // кнопки
    document.getElementById('btn-card').addEventListener('click', ()=> showFullCharacterInfo(selectedCharacter.id ?? selectedCharacter.name ?? ''));
    document.getElementById('btn-dice').addEventListener('click', rollDice);
    document.getElementById('btn-inv').addEventListener('click', openInventory);
    document.getElementById('btn-notes').addEventListener('click', openNotes);
    document.getElementById('to-menu').addEventListener('click', renderMainMenu);
    document.getElementById('prev')?.addEventListener('click', ()=> renderLocation(index-1));
    document.getElementById('next')?.addEventListener('click', ()=> renderLocation(index+1));
    document.getElementById('btn-newch')?.addEventListener('click', showNewCharacters);

    transitionIn();
  }

  // ---- Новые персонажи ----
  function showNewCharacters() {
    const ids = ['korgreyv', 'porje'];
    const list = ids.map(id => data.characters.characters.find(c => String(c.id) === String(id))).filter(Boolean);

    const wrap = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'grid-cards';
    wrap.innerHTML = `<h3 style="margin-top:0">Выберите нового персонажа</h3>`;
    list.forEach(char => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="images/${char.image}" class="character-image" alt="${char.name}" loading="lazy">
        <h3>${char.name}</h3>
        <p class="muted"><strong>Класс:</strong> ${char.class}</p>
        <p class="muted">${char.description.slice(0, 100)}${char.description.length>100?'…':''}</p>
        <button class="button small" data-pick="${char.id}">Выбрать</button>
      `;
      imageFallback(card.querySelector('img'));
      grid.appendChild(card);
    });
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem';
    actions.innerHTML = `<button class="button small ghost" id="close">Закрыть</button>`;

    wrap.appendChild(grid);
    wrap.appendChild(actions);

    const { close, modal } = openModal(wrap);
    wrap.querySelector('#close').addEventListener('click', close);
    grid.addEventListener('click',(e)=>{
      const btn = e.target.closest('button[data-pick]');
      if (!btn) return;
      replaceCharacter(btn.dataset.pick);
      close();
    });
  }

  function replaceCharacter(newId) {
    const newChar = data.characters.characters.find(c => String(c.id) === String(newId));
    if (!newChar) return;
    selectedCharacter = JSON.parse(JSON.stringify(newChar));
    saveState();
    renderLocation(currentLocationIndex);
    showToast(`Теперь вы: ${newChar.name}`);
  }

  // ---- Кости ----
  function rollDice() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h3 style="margin-top:0">Кости</h3>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin:.25rem 0">
        ${['D4','D6','D8','D10','D12','D20'].map(d=>`
          <label class="button small ghost" style="user-select:none">
            <input type="checkbox" value="${d}" style="margin-right:.4rem">${d}
          </label>
        `).join('')}
      </div>
      <div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center">
        <label>Кол-во бросков <input type="number" class="number" id="rolls" min="1" value="1" style="width:90px"></label>
        <button class="button small" id="do-roll">Бросить</button>
        <button class="button small ghost" id="clear">Очистить</button>
      </div>
      <div id="dice-result" class="card" style="margin-top:.6rem"></div>
      <div style="display:flex;gap:.5rem;margin-top:.6rem">
        <button class="button small ghost" id="close">Закрыть</button>
      </div>
    `;
    const { close } = openModal(wrap);

    const res = wrap.querySelector('#dice-result');
    const log = [];
    function appendResult(txt){ log.unshift(txt); res.innerHTML = log.slice(0,20).map(x=>`<div>${x}</div>`).join(''); }

    wrap.querySelector('#do-roll').addEventListener('click', ()=>{
      const selected = [...wrap.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);
      const times = Math.max(1, parseInt(wrap.querySelector('#rolls').value,10)||1);
      if (!selected.length) { appendResult('<em>Выберите кости…</em>'); return; }
      selected.forEach(die=>{
        const sides = parseInt(die.slice(1),10);
        const rolls = Array.from({length:times}, ()=> Math.floor(Math.random()*sides)+1);
        const sum = rolls.reduce((a,b)=>a+b,0);
        appendResult(`<strong>${die}</strong> → [${rolls.join(', ')}]  = <strong>${sum}</strong>`);
      });
    });
    wrap.querySelector('#clear').addEventListener('click', ()=>{ log.length=0; res.innerHTML=''; });
    wrap.querySelector('#close').addEventListener('click', close);
  }

  // ---- Инвентарь ----
  function openInventory() {
    let items = Array.isArray(selectedCharacter.inventory) ? [...selectedCharacter.inventory] : [];

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h3 style="margin-top:0">Инвентарь</h3>
      <div id="inventory-items" class="container" style="padding:0"></div>
      <div style="display:flex; gap:.5rem; margin-top:.5rem">
        <input class="input" id="new-item" placeholder="Новый предмет">
        <button class="button small" id="add-item">Добавить</button>
      </div>
      <div style="display:flex; gap:.5rem; margin-top:.6rem">
        <button class="button small" id="save">Сохранить</button>
        <button class="button small ghost" id="close">Закрыть</button>
      </div>
    `;
    const { close } = openModal(wrap);

    const list = wrap.querySelector('#inventory-items');
    const render = () => {
      list.innerHTML = '';
      items.forEach((item, i)=>{
        const row = document.createElement('div');
        row.className = 'card';
        row.style.padding = '.5rem';
        row.innerHTML = `
          <div style="display:flex; gap:.5rem">
            <input class="input" value="${item}">
            <button class="button small" data-del="${i}">Удалить</button>
          </div>
        `;
        row.querySelector('input').addEventListener('input', e => items[i] = e.target.value);
        row.querySelector('button[data-del]')?.addEventListener('click', ()=>{ items.splice(i,1); render(); });
        list.appendChild(row);
      });
    };
    render();

    wrap.querySelector('#add-item').addEventListener('click', ()=>{
      const val = wrap.querySelector('#new-item').value.trim();
      if (val){ items.push(val); wrap.querySelector('#new-item').value=''; render(); }
    });
    wrap.querySelector('#save').addEventListener('click', ()=>{
      selectedCharacter.inventory = items;
      saveState();
      showToast('Инвентарь сохранён');
    });
    wrap.querySelector('#close').addEventListener('click', close);
  }

  // ---- Заметки ----
  function openNotes() {
    let notes = Array.isArray(selectedCharacter.notes) ? [...selectedCharacter.notes] : [];

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h3 style="margin-top:0">Заметки</h3>
      <div id="notes" class="container" style="padding:0"></div>
      <div style="display:flex; gap:.5rem; margin-top:.5rem">
        <input class="input" id="new-note" placeholder="Новая заметка">
        <button class="button small" id="add-note">Добавить</button>
      </div>
      <div style="display:flex; gap:.5rem; margin-top:.6rem">
        <button class="button small" id="save">Сохранить</button>
        <button class="button small ghost" id="close">Закрыть</button>
      </div>
    `;
    const { close } = openModal(wrap);

    const list = wrap.querySelector('#notes');
    const render = () => {
      list.innerHTML = '';
      notes.forEach((note, i)=>{
        const row = document.createElement('div');
        row.className = 'card';
        row.style.padding = '.5rem';
        row.innerHTML = `
          <div style="display:grid; gap:.5rem">
            <textarea rows="3" class="input" style="resize:vertical">${note}</textarea>
            <button class="button small" data-del="${i}">Удалить</button>
          </div>
        `;
        row.querySelector('textarea').addEventListener('input', e => notes[i] = e.target.value);
        row.querySelector('button[data-del]')?.addEventListener('click', ()=>{ notes.splice(i,1); render(); });
        list.appendChild(row);
      });
    };
    render();

    wrap.querySelector('#add-note').addEventListener('click', ()=>{
      const val = wrap.querySelector('#new-note').value.trim();
      if (val){ notes.push(val); wrap.querySelector('#new-note').value=''; render(); }
    });
    wrap.querySelector('#save').addEventListener('click', ()=>{
      selectedCharacter.notes = notes;
      saveState();
      showToast('Заметки сохранены');
    });
    wrap.querySelector('#close').addEventListener('click', close);
  }

  // ---- Навигация хэдера ----
  btnHome.addEventListener('click', renderMainMenu);

  // ---- Старт приложения ----
  async function start() {
    loadState();
    const ok = await loadData();
    if (!ok) return;

    // куда идти при старте
    if (selectedCharacter) {
      renderLocation(currentLocationIndex);
    } else {
      renderMainMenu();
    }
  }

  return { start };
})();

APP.start();
