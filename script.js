/* script.js — Pro Version 2026 */
const APP = (() => {
  // --- DOM Elements ---
  const els = {
    app: document.getElementById('app'),
    toast: document.getElementById('toast'),
    btnHome: document.getElementById('btn-home'),
    bottomNav: document.getElementById('bottom-nav'),
    charAvatar: document.getElementById('char-avatar-mini'),
    navItems: document.querySelectorAll('.nav-item')
  };

  // --- Constants & State ---
  const STORAGE_KEY = 'dnd_companion_v2';
  let state = {
    data: null,
    user: {
      selectedCharId: null,
      charData: null, // Копия данных персонажа
      locationIndex: 0
    }
  };

  // --- Utility: Sleep & Toast ---
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const showToast = (msg) => {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2000);
  };

  // --- Image Optimization ---
  const imageCache = new Map();
  
  // Умная загрузка: сначала плейсхолдер, потом плавное появление
  function createOptimizedImage(src, alt) {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper loading';
    
    const img = new Image();
    img.alt = alt;
    img.src = src ? `images/${src}` : 'images/placeholder.webp';
    
    img.onload = () => {
      wrapper.classList.remove('loading');
      img.classList.add('loaded');
    };
    img.onerror = () => {
      wrapper.classList.remove('loading');
      // Можно подставить заглушку
      img.src = 'https://via.placeholder.com/600x340/222/c2a86f?text=No+Image'; 
      img.classList.add('loaded');
    };
    
    wrapper.appendChild(img);
    return wrapper;
  }

  // Предзагрузка следующей локации для мгновенного перехода
  function preloadNextLocation(currentIndex, locations) {
    const nextIdx = currentIndex + 1;
    if (nextIdx < locations.length) {
      const img = new Image();
      img.src = `images/${locations[nextIdx].image}`;
    }
  }

  // --- Data Management ---
  async function init() {
    try {
      // Параллельная загрузка
      const [chars, locs] = await Promise.all([
        fetch('./characters.json').then(r => r.json()),
        fetch('./locations.json').then(r => r.json())
      ]);
      
      state.data = { characters: chars.characters, locations: locs.locations };
      loadState();
      
      // Routing
      if (state.user.selectedCharId && state.user.charData) {
        renderLocationScreen();
      } else {
        renderMainMenu();
      }
    } catch (e) {
      els.app.innerHTML = `<div class="container"><div class="card"><h3>Ошибка загрузки</h3><p>${e.message}</p></div></div>`;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
  }
  
  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Валидация
        if (parsed.selectedCharId) state.user = parsed;
      } catch (e) { console.error('Corrupt save'); }
    }
  }

  // --- Renderers ---

  // 1. MAIN MENU
  function renderMainMenu() {
    els.bottomNav.hidden = true;
    els.charAvatar.hidden = true;
    els.app.innerHTML = `
      <div class="container" style="text-align:center; padding-top:2rem">
        <h1 style="font-size:2.5rem; margin-bottom:0.5rem">Записки<br>Сумасшедшего</h1>
        <p>Компаньон для D&D кампании</p>
        <div style="margin-top:2rem">
          <button class="btn" id="btn-start">Начать игру</button>
          ${state.user.selectedCharId ? `<button class="btn ghost" id="btn-continue" style="margin-top:1rem">Продолжить</button>` : ''}
        </div>
      </div>
    `;
    document.getElementById('btn-start').onclick = renderCharSelect;
    const btnCont = document.getElementById('btn-continue');
    if(btnCont) btnCont.onclick = renderLocationScreen;
  }

  // 2. CHARACTER SELECT
  function renderCharSelect() {
    els.app.innerHTML = `
      <div class="container">
        <h2>Выберите героя</h2>
        <div class="grid-cards" id="char-grid"></div>
        <button class="btn ghost" id="back-menu">Назад</button>
      </div>
    `;
    
    const grid = document.getElementById('char-grid');
    const blacklist = ['korgreyv', 'porje', 'andrey']; // Скрытые
    
    state.data.characters.filter(c => !blacklist.includes(c.id)).forEach(char => {
      const el = document.createElement('div');
      el.className = 'char-card card';
      el.innerHTML = `
        <img src="images/${char.image}" loading="lazy" alt="${char.name}">
        <h3>${char.name}</h3>
        <p class="text-small">${char.class}</p>
      `;
      el.onclick = () => selectCharacter(char);
      grid.appendChild(el);
    });
    
    document.getElementById('back-menu').onclick = renderMainMenu;
  }

  function selectCharacter(originalChar) {
    // Глубокое копирование для независимости состояния
    state.user.charData = JSON.parse(JSON.stringify(originalChar));
    state.user.selectedCharId = originalChar.id;
    state.user.locationIndex = 0;
    saveState();
    renderLocationScreen();
  }

  // 3. LOCATION SCREEN (Core UI)
  function renderLocationScreen() {
    const loc = state.data.locations[state.user.locationIndex];
    if (!loc) return;

    // UI Updates
    els.bottomNav.hidden = false;
    setActiveNav('map');
    
    // Avatar Update
    els.charAvatar.style.backgroundImage = `url('images/${state.user.charData.image}')`;
    els.charAvatar.hidden = false;
    els.charAvatar.onclick = () => openModal('character');

    // Preload next
    preloadNextLocation(state.user.locationIndex, state.data.locations);

    els.app.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'container';

    // Image
    container.appendChild(createOptimizedImage(loc.image, loc.title));

    // Text Content
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card';
    cardInfo.innerHTML = `
      <h2>${loc.title}</h2>
      <p>${loc.description}</p>
      <div class="btn-group">
        ${state.user.locationIndex > 0 ? `<button class="btn ghost btn-nav" id="loc-prev">← Назад</button>` : '<div></div>'}
        ${state.user.locationIndex < state.data.locations.length - 1 ? `<button class="btn btn-nav" id="loc-next">Вперёд →</button>` : ''}
      </div>
    `;
    container.appendChild(cardInfo);

    // Stats Section (Horizontal Scroll)
    const statsContainer = document.createElement('div');
    statsContainer.innerHTML = `<h3 style="margin-left:0.5rem; margin-bottom:0.5rem">Характеристики</h3>`;
    const scroller = document.createElement('div');
    scroller.className = 'stats-scroller';
    
    // Рендер каждого стата
    Object.entries(state.user.charData.stats).forEach(([key, val]) => {
      const statCard = document.createElement('div');
      statCard.className = 'stat-card';
      statCard.innerHTML = `
        <span class="stat-label">${key}</span>
        <div class="stepper">
          <button data-op="dec" data-key="${key}">−</button>
          <span>${val}</span>
          <button data-op="inc" data-key="${key}">+</button>
        </div>
      `;
      scroller.appendChild(statCard);
    });
    
    // Делегирование событий для степпера
    scroller.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const key = btn.dataset.key;
      const span = btn.parentElement.querySelector('span');
      let current = parseInt(span.textContent);
      
      if (btn.dataset.op === 'inc') current++;
      else current--;
      
      span.textContent = current;
      state.user.charData.stats[key] = current;
      debouncedSave();
    });

    statsContainer.appendChild(scroller);
    container.appendChild(statsContainer);
    els.app.appendChild(container);

    // Event Listeners
    document.getElementById('loc-prev')?.addEventListener('click', () => changeLocation(-1));
    document.getElementById('loc-next')?.addEventListener('click', () => changeLocation(1));
  }

  function changeLocation(dir) {
    state.user.locationIndex += dir;
    saveState();
    // Плавный скролл наверх
    els.app.scrollTo(0,0);
    renderLocationScreen();
  }

  let saveTimeout;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  }

  // --- Navigation & Modals Logic ---
  els.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      if (target === 'map') {
        // Если уже на карте, ничего не делаем или скроллим вверх
        if(btn.classList.contains('active')) els.app.scrollTo({top:0, behavior:'smooth'});
        else renderLocationScreen(); 
      }
      else if (target === 'inv') openModal('inventory');
      else if (target === 'dice') openModal('dice');
      else if (target === 'notes') openModal('notes');
    });
  });

  function setActiveNav(name) {
    els.navItems.forEach(n => n.classList.toggle('active', n.dataset.nav === name));
  }

  // Универсальная модалка
  function openModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    let contentHTML = '';
    
    if (type === 'dice') {
      contentHTML = `
        <h3>Бросок костей</h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:1rem 0;">
          ${['D4','D6','D8','D10','D12','D20'].map(d => 
            `<button class="btn ghost dice-btn" data-d="${d}">${d}</button>`
          ).join('')}
        </div>
        <div id="dice-log" class="card" style="min-height:80px; background:#111; font-family:monospace; font-size:0.9rem; overflow-y:auto; max-height:150px"></div>
        <button class="btn" style="margin-top:1rem" id="modal-close">Закрыть</button>
      `;
    } else if (type === 'inventory') {
      const items = state.user.charData.inventory || [];
      contentHTML = `
        <h3>Инвентарь</h3>
        <ul id="inv-list" style="list-style:none; padding:0; margin:1rem 0; max-height:40vh; overflow-y:auto">
          ${items.map((it, i) => `<li style="padding:8px; border-bottom:1px solid #333; display:flex; justify-content:space-between">${it} <span style="color:red; cursor:pointer" data-del="${i}">×</span></li>`).join('')}
        </ul>
        <div style="display:flex; gap:0.5rem">
          <input id="inv-input" class="card" style="flex:1; padding:0.8rem; color:#fff" placeholder="Предмет...">
          <button id="inv-add" class="btn" style="width:auto">+</button>
        </div>
        <button class="btn ghost" style="margin-top:1rem" id="modal-close">Закрыть</button>
      `;
    } else if (type === 'character') {
        const c = state.user.charData;
        contentHTML = `
            <div style="text-align:center">
                <img src="images/${c.image}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:2px solid var(--accent)">
                <h3>${c.name}</h3>
                <p>${c.class}</p>
                <p class="text-small" style="text-align:left; margin-top:1rem">${c.description}</p>
            </div>
            <button class="btn" style="margin-top:1rem" id="modal-close">Закрыть</button>
        `;
    } else if (type === 'notes') {
        // Аналогично инвентарю, но textarea
        contentHTML = `<h3>Заметки</h3><p>Функционал заметок аналогичен инвентарю...</p><button class="btn" id="modal-close">Закрыть</button>`; 
    }

    modal.innerHTML = `<div class="modal-content">${contentHTML}</div>`;
    document.body.appendChild(modal);
    
    // Force reflow for animation
    requestAnimationFrame(() => modal.classList.add('open'));

    // Логика внутри модалки
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'modal-close') {
            modal.classList.remove('open');
            setTimeout(() => modal.remove(), 250);
        }
        
        // Логика костей
        if (e.target.classList.contains('dice-btn')) {
            const die = parseInt(e.target.dataset.d.substring(1));
            const val = Math.floor(Math.random() * die) + 1;
            const log = modal.querySelector('#dice-log');
            log.innerHTML = `<div style="padding:4px; border-bottom:1px solid #333">🎲 <strong>${e.target.dataset.d}</strong>: <span style="color:var(--accent)">${val}</span></div>` + log.innerHTML;
        }

        // Логика инвентаря
        if (e.target.id === 'inv-add') {
            const input = modal.querySelector('#inv-input');
            if(input.value.trim()) {
                state.user.charData.inventory.push(input.value.trim());
                saveState();
                showToast('Добавлено');
                // Перерисовка списка (упрощенно: закрыть/открыть или дом манипуляция)
                input.value = '';
                const list = modal.querySelector('#inv-list');
                const li = document.createElement('li');
                li.style.cssText = "padding:8px; border-bottom:1px solid #333; display:flex; justify-content:space-between";
                li.innerHTML = `${state.user.charData.inventory.at(-1)} <span>×</span>`;
                list.appendChild(li);
            }
        }
    });
  }

  els.btnHome.addEventListener('click', () => {
      if(confirm('Вернуться в главное меню?')) renderMainMenu();
  });

  return { init };
})();

document.addEventListener('DOMContentLoaded', APP.init);
