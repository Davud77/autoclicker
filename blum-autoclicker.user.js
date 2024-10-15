// ==UserScript==
// @name         Blum Autoclicker
// @version      2.3
// @namespace    Violentmonkey Scripts
// @author       Davud77
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/Davud77/autoclicker/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/Davud77/autoclicker/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/Davud77/autoclicker/
// ==/UserScript==

let GAME_SETTINGS = {
    minBombHits: Math.floor(Math.random() * 2),
    minIceHits: Math.floor(Math.random() * 2) + 2,
    flowerSkipPercentage: Math.floor(Math.random() * 11) + 15,
    minDelayMs: 2000,
    maxDelayMs: 5000,
    autoClickPlay: false
};

let isGamePaused = false;

try {
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false,
    };

    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    function handleGameElement(element) {
        if (!element || !element.item) return;

        const { type } = element.item;
        switch (type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "FREEZE":
                processIce(element);
                break;
        }
    }

    function processFlower(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
        if (shouldSkip) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            clickElement(element);
        }
    }

    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            clickElement(element);
            gameStats.bombHits++;
        }
    }

    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            clickElement(element);
            gameStats.iceHits++;
        }
    }

    function clickElement(element) {
        element.onClick(element);
        element.isExplosion = true;
        element.addedAt = performance.now();
    }

    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
        }
    }

    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false,
        };
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

  function checkAndClickPlayButton() {
    const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary, a.play-btn[href="/game"], button.kit-button.is-large.is-primary');

    playButtons.forEach(button => {
        if (!isGamePaused && GAME_SETTINGS.autoClickPlay && (/Play/.test(button.textContent) || /Continue/.test(button.textContent))) {
            setTimeout(() => {
                button.click();
                gameStats.isGameOver = false;
            }, getNewGameDelay());
        }
    });
}


    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    continuousPlayButtonCheck();

  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'settings-menu';
  settingsMenu.style.display = 'none';

  const menuTitle = document.createElement('h3');
  menuTitle.className = 'settings-title';
  menuTitle.textContent = 'Blum Autoclicker';

  const closeButton = document.createElement('button');
  closeButton.className = 'settings-close-button';
  closeButton.textContent = '×';
  closeButton.onclick = () => {
    settingsMenu.style.display = 'none';
  };

  menuTitle.appendChild(closeButton);
  settingsMenu.appendChild(menuTitle);
  
  function updateSettingsMenu() {
    document.getElementById('flowerSkipPercentage').value = GAME_SETTINGS.flowerSkipPercentage;
    document.getElementById('flowerSkipPercentageDisplay').textContent = GAME_SETTINGS.flowerSkipPercentage;
    document.getElementById('minIceHits').value = GAME_SETTINGS.minIceHits;
    document.getElementById('minIceHitsDisplay').textContent = GAME_SETTINGS.minIceHits;
    document.getElementById('minBombHits').value = GAME_SETTINGS.minBombHits;
    document.getElementById('minBombHitsDisplay').textContent = GAME_SETTINGS.minBombHits;
    document.getElementById('minDelayMs').value = GAME_SETTINGS.minDelayMs;
    document.getElementById('minDelayMsDisplay').textContent = GAME_SETTINGS.minDelayMs;
    document.getElementById('maxDelayMs').value = GAME_SETTINGS.maxDelayMs;
    document.getElementById('maxDelayMsDisplay').textContent = GAME_SETTINGS.maxDelayMs;
    document.getElementById('autoClickPlay').checked = GAME_SETTINGS.autoClickPlay;
  }

  settingsMenu.appendChild(createSettingElement('Flower Skip (%)', 'flowerSkipPercentage', 'range', 0, 100, 1,
    'EN: Percentage probability of skipping a flower.<br>' +
    'RU: Вероятность пропуска цветка в процентах.'));
  settingsMenu.appendChild(createSettingElement('Min Freeze Hits', 'minIceHits', 'range', 1, 10, 1,
    'EN: Minimum number of clicks per freeze.<br>' +
    'RU: Минимальное количество кликов на заморозку.'));
  settingsMenu.appendChild(createSettingElement('Min Bomb Hits', 'minBombHits', 'range', 0, 10, 1,
    'EN: Minimum number of clicks per bomb.<br>' +
    'RU: Минимальное количество кликов на бомбу.'));
  settingsMenu.appendChild(createSettingElement('Min Delay (ms)', 'minDelayMs', 'range', 10, 10000, 10,
    'EN: Minimum delay between clicks.<br>' +
    'RU: Минимальная задержка между кликами.'));
  settingsMenu.appendChild(createSettingElement('Max Delay (ms)', 'maxDelayMs', 'range', 10, 10000, 10,
    'EN: Maximum delay between clicks.<br>' +
    'RU: Максимальная задержка между кликами.'));
  settingsMenu.appendChild(createSettingElement('Auto Click Play', 'autoClickPlay', 'checkbox', null, null, null,
    'EN: Automatically start the next game at the end of.<br>' +
    'RU: Автоматически начинать следующую игру по окончании.'));

  const pauseResumeButton = document.createElement('button');
  pauseResumeButton.textContent = 'Pause';
  pauseResumeButton.className = 'pause-resume-btn';
  pauseResumeButton.onclick = toggleGamePause;
  settingsMenu.appendChild(pauseResumeButton);



  document.body.appendChild(settingsMenu);

  const settingsButton = document.createElement('button');
  settingsButton.className = 'settings-button';
  settingsButton.textContent = '⚙️';
  settingsButton.onclick = () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
  };
  document.body.appendChild(settingsButton);

  const style = document.createElement('style');
  style.textContent = `
    .settings-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(40, 44, 52, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      color: #abb2bf;
      font-family: 'Arial', sans-serif;
      z-index: 10000;
      padding: 20px;
      width: 300px;
    }
    .settings-title {
      color: #61afef;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .settings-close-button {
      background: none;
      border: none;
      color: #e06c75;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
    }
    .setting-item {
      margin-bottom: 12px;
    }
    .setting-label {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .setting-label-text {
      color: #e5c07b;
      margin-right: 5px;
    }
    .help-icon {
      cursor: help;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #61afef;
      color: #282c34;
      font-size: 10px;
      font-weight: bold;
    }
    .setting-input {
      display: flex;
      align-items: center;
    }
    .setting-slider {
      flex-grow: 1;
      margin-right: 8px;
    }
    .setting-value {
      min-width: 30px;
      text-align: right;
      font-size: 11px;
    }
    .tooltip {
      position: relative;
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 200px;
      background-color: #4b5263;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px;
      position: absolute;
      z-index: 1;
      bottom: 125%;
      left: 50%;
      margin-left: -100px;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .tooltip:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }
    .pause-resume-btn {
      display: block;
      width: calc(100% - 10px);
      padding: 8px;
      margin: 15px 5px;
      background-color: #98c379;
      color: #282c34;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .pause-resume-btn:hover {
      background-color: #7cb668;
    }
    .social-buttons {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      white-space: nowrap;
    }
    .social-button {
      display: inline-flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      background-color: #282c34;
      color: #abb2bf;
      text-decoration: none;
      font-size: 12px;
      transition: background-color 0.3s;
    }
    .social-button:hover {
      background-color: #4b5263;
    }
    .social-button img {
      width: 16px;
      height: 16px;
      margin-right: 5px;
    }
    .settings-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(36, 146, 255, 0.8);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);

  function createSettingElement(label, id, type, min, max, step, tooltipText) {
    const container = document.createElement('div');
    container.className = 'setting-item';

    const labelContainer = document.createElement('div');
    labelContainer.className = 'setting-label';

    const labelElement = document.createElement('span');
    labelElement.className = 'setting-label-text';
    labelElement.textContent = label;

    const helpIcon = document.createElement('span');
    helpIcon.textContent = '?';
    helpIcon.className = 'help-icon tooltip';

    const tooltipSpan = document.createElement('span');
    tooltipSpan.className = 'tooltiptext';
    tooltipSpan.innerHTML = tooltipText;
    helpIcon.appendChild(tooltipSpan);

    labelContainer.appendChild(labelElement);
    labelContainer.appendChild(helpIcon);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'setting-input';

    function AutoClaimAndStart() {
      setInterval(() => {
        const claimButton = document.querySelector('button.kit-button.is-large.is-drop.is-fill.button.is-done');
        const startFarmingButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.button');
        const continueButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.btn');
        if (claimButton) {
          claimButton.click();
        } else if (startFarmingButton) {
          startFarmingButton.click();
        } else if (continueButton) {
          continueButton.click();
        }
      }, Math.floor(Math.random() * 5000) + 5000);
    }

    AutoClaimAndStart();

    let input;
    if (type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.checked = GAME_SETTINGS[id];
      input.addEventListener('change', (e) => {
        GAME_SETTINGS[id] = e.target.checked;
        saveSettings();
      });
      inputContainer.appendChild(input);
    } else {
      input = document.createElement('input');
      input.type = type;
      input.id = id;
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = GAME_SETTINGS[id];
      input.className = 'setting-slider';

      const valueDisplay = document.createElement('span');
      valueDisplay.id = `${id}Display`;
      valueDisplay.textContent = GAME_SETTINGS[id];
      valueDisplay.className = 'setting-value';

      input.addEventListener('input', (e) => {
        GAME_SETTINGS[id] = parseFloat(e.target.value);
        valueDisplay.textContent = e.target.value;
        saveSettings();
      });

      inputContainer.appendChild(input);
      inputContainer.appendChild(valueDisplay);
    }

    container.appendChild(labelContainer);
    container.appendChild(inputContainer);
    return container;
  }

  function saveSettings() {
    localStorage.setItem('BlumAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem('BlumAutoclickerSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      GAME_SETTINGS = {
        ...GAME_SETTINGS,
        ...parsedSettings
      };
    }
  }

  loadSettings();
  updateSettingsMenu();

  function toggleGamePause() {
    isGamePaused = !isGamePaused;
    pauseResumeButton.textContent = isGamePaused ? 'Resume' : 'Pause';
    pauseResumeButton.style.backgroundColor = isGamePaused ? '#e5c07b' : '#98c379';
  }
} catch (e) {
  console.error("Blum Autoclicker error:", e);
}
