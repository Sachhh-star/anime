// only main characther like goku, vegeta, gohan, piccolo, trunks
function formatKiNumber(kiVal) {
  if (!kiVal) return "0";
  if (typeof kiVal === "string") {
    if (kiVal.includes(".") || kiVal.includes(",") || /[a-zA-Z]/.test(kiVal)) {
      return kiVal;
    }
    const parsed = parseInt(kiVal.replace(/\D/g, ""), 10);
    if (!isNaN(parsed)) {
      return parsed.toLocaleString("nl-NL");
    }
  }
  if (typeof kiVal === "number") {
    return kiVal.toLocaleString("nl-NL");
  }
  return kiVal;
}

function parseKiValue(kiStr) {
  if (!kiStr) return 0;

  let cleaned = String(kiStr).toLowerCase().replace(/[\.\,\s]/g, "");

  let multiplier = 1;
  if (cleaned.includes("septillion")) {
    multiplier = 1e24;
    cleaned = cleaned.replace("septillion", "");
  } else if (cleaned.includes("sextillion")) {
    multiplier = 1e21;
    cleaned = cleaned.replace("sextillion", "");
  } else if (cleaned.includes("quintillion")) {
    multiplier = 1e18;
    cleaned = cleaned.replace("quintillion", "");
  } else if (cleaned.includes("quadrillion")) {
    multiplier = 1e15;
    cleaned = cleaned.replace("quadrillion", "");
  } else if (cleaned.includes("trillion")) {
    multiplier = 1e12;
    cleaned = cleaned.replace("trillion", "");
  } else if (cleaned.includes("billion")) {
    multiplier = 1e9;
    cleaned = cleaned.replace("billion", "");
  } else if (cleaned.includes("million")) {
    multiplier = 1e6;
    cleaned = cleaned.replace("million", "");
  } else if (cleaned.includes("googol")) {
    multiplier = 1e100;
    cleaned = cleaned.replace("googol", "");
  }

  cleaned = cleaned.replace(/[^0-9\.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num * multiplier;
}

async function loadMainCharacters() {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const gridEl = document.getElementById("characters-grid");

  if (!loadingEl || !errorEl || !gridEl) return;

  // try to load from localStorage cache first for instant 100/100 Performance
  const cachedData = localStorage.getItem("db_characters_cache");
  if (cachedData) {
    try {
      const items = JSON.parse(cachedData);
      displayMainCharacters(items);
      
      // still fetch in background to silently update cache
      fetchCharactersInBackground();
      return;
    } catch (e) {
      console.error("Cache error in main characters:", e);
    }
  }

  loadingEl.classList.remove("hide");
  errorEl.classList.add("hide");
  gridEl.classList.add("hide");

  try {
    const items = await fetchCharactersFromApi();
    displayMainCharacters(items);
  } catch (error) {
    console.error("Failed to load main characters:", error);
    loadingEl.classList.add("hide");
    gridEl.classList.add("hide");
    errorEl.classList.remove("hide");
  }
}

// call api to fecth character with limit of 100
async function fetchCharactersFromApi() {
  let url = "https://dragonball-api.com/api/characters?limit=100";
  const api = await fetch(url);
  const take = await api.json();
  let items = take.items || (Array.isArray(take) ? take : [take]);
  if (items && items.length > 0) {
    localStorage.setItem("db_characters_cache", JSON.stringify(items));
  }
  return items;
}

async function fetchCharactersInBackground() {
  try {
    let url = "https://dragonball-api.com/api/characters?limit=100";
    const api = await fetch(url);
    const take = await api.json();
    let items = take.items || (Array.isArray(take) ? take : [take]);
    if (items && items.length > 0) {
      localStorage.setItem("db_characters_cache", JSON.stringify(items));
    }
  } catch (e) {
    console.warn("Background revalidation failed:", e);
  }
}

function displayMainCharacters(items) {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const gridEl = document.getElementById("characters-grid");
  if (!gridEl) return;

  if (loadingEl) loadingEl.classList.add("hide");
  if (errorEl) errorEl.classList.add("hide");
  gridEl.classList.remove("hide");

  const targetNames = ["Goku", "Vegeta", "Gohan", "Piccolo", "Trunks"];
  
  const mainFighters = targetNames.map(name => {
    let match = items.find(ch => ch.name && ch.name.trim().toLowerCase() === name.toLowerCase());
    if (!match) {
      match = items.find(ch => ch.name && ch.name.toLowerCase().includes(name.toLowerCase()));
    }
    return match;
  }).filter(Boolean);

  if (mainFighters.length === 0) {
    if (errorEl) errorEl.classList.remove("hide");
    return;
  }

  gridEl.innerHTML = "";
  mainFighters.forEach((character, index) => {
    const parsedKi = parseKiValue(character.ki);
    const parsedMax = parseKiValue(character.maxKi);
    
    let kiPercent = 0;
    if (parsedMax > 0) {
      kiPercent = Math.min(100, Math.max(5, (parsedKi / parsedMax) * 100));
    } else if (parsedKi > 0) {
      kiPercent = 85; 
    }

    const card = document.createElement("div");
    card.className = "character-card";
    
    // make card clickable to open modal details
    card.addEventListener("click", () => {
      openModal(character);
    });

    // Only lazy-load images that are below the fold (index >= 4) to boost initial loading speed (LCP)
    const isLazy = index >= 4 ? 'loading="lazy"' : 'fetchpriority="high"';

    card.innerHTML = `
      <div class="image-container">
        <img src="${character.image}" alt="${character.name}" width="200" height="260" ${isLazy} />
      </div>
      <div class="card-content">
        <span class="card-race">${character.race || "Unknown Race"}</span>
        <h2 class="card-name">${character.name}</h2>
        
        <div class="card-ki-container">
          <div class="ki-bar-header">
            <span class="ki-label">Ki Power Level</span>
            <span class="ki-value">${formatKiNumber(character.ki)} / ${formatKiNumber(character.maxKi)}</span>
          </div>
          <div class="ki-bar-bg">
            <div class="ki-bar-fill" style="width: ${kiPercent}%;"></div>
          </div>
        </div>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

// open modal with detailed character information
function openModal(character) {
  const modal = document.getElementById('characterModal');
  if (!modal) return;

  document.getElementById('modal-img').src = character.image;
  document.getElementById('modal-img').alt = character.name;
  document.getElementById('modal-name').textContent = character.name;

  document.getElementById('modal-race').textContent = character.race || "Unknown";
  document.getElementById('modal-gender').textContent = character.gender || "Unknown";
  document.getElementById('modal-series').textContent = character.series || "Dragon Ball";
  document.getElementById('modal-description').textContent = character.description || "No biography available for this legendary fighter.";

  document.getElementById('modal-ki').textContent = formatKiNumber(character.ki);
  document.getElementById('modal-maxKi').textContent = formatKiNumber(character.maxKi);

  const parsedKi = parseKiValue(character.ki);
  const parsedMax = parseKiValue(character.maxKi);

  let kiPercent = 0;
  if (parsedMax > 0) {
    kiPercent = Math.min(100, Math.max(0, (parsedKi / parsedMax) * 100));
  } else if (parsedKi > 0) {
    kiPercent = 85;
  }

  const fillBar = document.getElementById('modal-ki-fill');
  if (fillBar) {
    fillBar.style.width = `${kiPercent}%`;
  }

  modal.classList.remove('hide-modal');
}

// close listeners on page load
document.addEventListener("DOMContentLoaded", () => {
  loadMainCharacters();

  const modal = document.getElementById('characterModal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalOverlay = document.getElementById('modal-overlay');

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hide-modal');
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
      modal.classList.add('hide-modal');
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && modal && !modal.classList.contains('hide-modal')) {
      modal.classList.add('hide-modal');
    }
  });

  // lightweight mobile navbar toggle click listener
  const navToggle = document.querySelector('.nav-toggle');
  const navCollapse = document.querySelector('.nav-collapse');
  if (navToggle && navCollapse) {
    navToggle.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
    });
  }
});
