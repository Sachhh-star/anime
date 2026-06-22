let allCharacters = [];

function formatKiNumber(kiVal) {
  if (!kiVal) return "0";
  console.log("Formatting Ki value:", kiVal);
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
console.log("Parsing Ki value:", kiStr);
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

async function zoeken() {
  const result = document.getElementById("resutaalt");
  if (!result) return;

  // try to load from localStorage cache first for instant 100/100 Performance
  const cachedData = localStorage.getItem("db_characters_cache");
  if (cachedData) {
    try {
      const items = JSON.parse(cachedData);
      allCharacters = items;
      // Render immediately!
      renderCharacters(allCharacters.slice(0, 12));
      
      // remaining character 
      deferRemainingCharacters(allCharacters.slice(12));
      
      // bg revalidation to update in the bg without blocking 
      fetchCharactersInBackground();
      return;
    } catch (e) {
      console.error("Cache parse error, falling back to API:", e);
    }
  }

  result.innerHTML = `<p class="text-gold text-center">Gathering Ki Energy...</p>`;

  // adding api call
  try {
    const items = await fetchCharactersFromApi();
    if (!items || items.length === 0) {
      result.innerHTML = "<p class='text-gold text-center'>No legendaries could be found.</p>";
      return;
    }

    allCharacters = items;
    // render the first 12 characters for instant initial page loading
    renderCharacters(allCharacters.slice(0, 12));
    
    // Defer the remaining characters until user activity or a fallback timeout
    deferRemainingCharacters(allCharacters.slice(12));
  } catch (error) {
    console.error("API error:", error);
    result.innerHTML = "<p class='text-red text-center'>Er is een fout opgetreden bij het laden van de Ki-krijgers.</p>";
  }
}

function deferRemainingCharacters(items) {
  let loaded = false;
  
  const loadRemaining = () => {
    if (loaded) return;
    loaded = true;
    
    // this is remove listener for scroll, mousemove and touchstart
    window.removeEventListener('scroll', loadRemaining);
    window.removeEventListener('mousemove', loadRemaining);
    window.removeEventListener('touchstart', loadRemaining);
    clearTimeout(fallbackTimeout);
    
    // this load the remaining characters 
    renderRemainingCharacters(items);
  };

  window.addEventListener('scroll', loadRemaining, { passive: true });
  window.addEventListener('mousemove', loadRemaining, { passive: true });
  window.addEventListener('touchstart', loadRemaining, { passive: true });

  const fallbackTimeout = setTimeout(loadRemaining, 3500);
}

// api 
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

function renderCharacters(itemsToDisplay) {
  const result = document.getElementById("resutaalt");
  if (!result) return;

  result.innerHTML = "";

  if (itemsToDisplay.length === 0) {
    result.innerHTML = `
      <div class="container text-center padding-y-large" style="grid-column: 1 / -1;">
        <p class="text-gold" style="font-size: 1.2rem; font-weight: 600;">Geen legendarische krijgers gevonden met dit filter!</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  itemsToDisplay.forEach((character, index) => {
    const charactersDiv = document.createElement("div");
    charactersDiv.className = "charac";

    charactersDiv.addEventListener("click", () => {
      openModal(character);
    });

    const isLazy = index >= 4 ? 'loading="lazy"' : 'fetchpriority="high"';

    charactersDiv.innerHTML = `
      <img src="${character.image}" alt="${character.name}" width="200" height="260" ${isLazy} />
      <h2>${character.name}</h2> 
      <p class="race-subtitle">${character.race}</p>
    `;

    fragment.appendChild(charactersDiv);
  });

  result.appendChild(fragment);
}

function renderRemainingCharacters(itemsToDisplay) {
  const result = document.getElementById("resutaalt");
  if (!result || itemsToDisplay.length === 0) return;

  const chunkSize = 15;
  let currentIndex = 0;

  function renderNextChunk() {
    const chunk = itemsToDisplay.slice(currentIndex, currentIndex + chunkSize);
    if (chunk.length === 0) return;

    const fragment = document.createDocumentFragment();

    chunk.forEach((character) => {
      const charactersDiv = document.createElement("div");
      charactersDiv.className = "charac";

      charactersDiv.addEventListener("click", () => {
        openModal(character);
      });

      charactersDiv.innerHTML = `
        <img src="${character.image}" alt="${character.name}" width="200" height="260" loading="lazy" />
        <h2>${character.name}</h2> 
        <p class="race-subtitle">${character.race}</p>
      `;

      fragment.appendChild(charactersDiv);
    });

    result.appendChild(fragment);
    currentIndex += chunkSize;

    // schedule the next chunk in the next animation frame, keeping the main thread free
    if (currentIndex < itemsToDisplay.length) {
      requestAnimationFrame(renderNextChunk);
    }
  }

  // start chunked rendering in the next animation frame
  requestAnimationFrame(renderNextChunk);
}

function openModal(character) {
  const modal = document.getElementById('characterModal');
  if (!modal) return;

  document.getElementById('modal-img').src = character.image;
  document.getElementById('modal-img').alt = character.name;
  document.getElementById('modal-name').textContent = character.name;

  document.getElementById('modal-race').textContent = character.race || "Onbekend";
  document.getElementById('modal-gender').textContent = character.gender || "Onbekend";
  document.getElementById('modal-series').textContent = character.series || "Dragon Ball";
  document.getElementById('modal-description').textContent = character.description || "Geen verdere informatie beschikbaar over deze krijger.";

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

document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.getElementById("zoekBar");
  const alphabetFilterContainer = document.getElementById("alphabet-filter");

  //  api
  zoeken().then(() => {
    //  alphabet buttons
    createAlphabetFilter();
  });

  //  a to z alphabet buttons
  function createAlphabetFilter() {
    if (!alphabetFilterContainer) return;
    alphabetFilterContainer.innerHTML = "";

    // all button
    const allBtn = document.createElement("button");
    allBtn.className = "alpha-btn active";
    allBtn.style.width = "auto";
    allBtn.style.padding = "0 14px";
    allBtn.style.borderRadius = "18px";
    allBtn.textContent = "All";
    
    allBtn.addEventListener("click", () => {
      clearAlphabetActive();
      allBtn.classList.add("active");
      
      setActiveBtn(document.getElementById("btn-all"));
      clearSearchInput();
      
      renderCharacters(allCharacters);
    });
    alphabetFilterContainer.appendChild(allBtn);

    // a to z letters
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      
      // check if any character starts with this letter, if not skip creating button for it
      const hasCharacters = allCharacters.some(character => {
        const name = (character.name || "").trim().toUpperCase();
        return name.startsWith(letter);
      });
      
      if (!hasCharacters) continue;

      const btn = document.createElement("button");
      btn.className = "alpha-btn";
      btn.textContent = letter;
      
      btn.addEventListener("click", () => {
        clearAlphabetActive();
        btn.classList.add("active");
        
        clearSearchInput();
        
        const categoryBtns = [
          document.getElementById("btn-all"),
          document.getElementById("btn-male"),
          document.getElementById("btn-female"),
          document.getElementById("btn-saiyan"),
          document.getElementById("btn-human")
        ];
        categoryBtns.forEach(b => {
          if (b) b.classList.remove("active");
        });

        const filtered = allCharacters.filter(character => {
          const name = (character.name || "").trim().toUpperCase();
          return name.startsWith(letter);
        });

        renderCharacters(filtered);
      });
      
      alphabetFilterContainer.appendChild(btn);
    }
  }

  function clearAlphabetActive() {
    if (!alphabetFilterContainer) return;
    const btns = alphabetFilterContainer.querySelectorAll(".alpha-btn");
    btns.forEach(b => b.classList.remove("active"));
  }

  if (searchBar) {
    searchBar.addEventListener("input", () => {
      const query = searchBar.value.toLowerCase().trim();

      const btnAll = document.getElementById("btn-all");
      const btns = [btnAll, document.getElementById("btn-male"), document.getElementById("btn-female"), document.getElementById("btn-saiyan"), document.getElementById("btn-human")];
      btns.forEach(b => {
        if (b) b.classList.remove("active");
      });
      if (btnAll) btnAll.classList.add("active");

      const alphaBtns = document.querySelectorAll(".alpha-btn");
      alphaBtns.forEach((b, idx) => {
        if (idx === 0) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });

      const filtered = allCharacters.filter(character => {
        const charName = (character.name || "").toLowerCase();
        const charRace = (character.race || "").toLowerCase();
        return charName.includes(query) || charRace.includes(query);
      });

      renderCharacters(filtered);
    });

    searchBar.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
  }

  const btnAll = document.getElementById("btn-all");
  const btnMale = document.getElementById("btn-male");
  const btnFemale = document.getElementById("btn-female");
  const btnSaiyan = document.getElementById("btn-saiyan");
  const btnHuman = document.getElementById("btn-human");

  function setActiveBtn(clickedBtn) {
    const btns = [btnAll, btnMale, btnFemale, btnSaiyan, btnHuman];
    btns.forEach(b => {
      if (b) b.classList.remove("active");
    });
    if (clickedBtn) clickedBtn.classList.add("active");

    // reset alphabetical filter buttons back to all active
    const alphaBtns = document.querySelectorAll(".alpha-btn");
    alphaBtns.forEach((b, idx) => {
      if (idx === 0) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }

  function clearSearchInput() {
    if (searchBar) searchBar.value = "";
  }

  if (btnAll) {
    btnAll.addEventListener("click", () => {
      setActiveBtn(btnAll);
      clearSearchInput();
      renderCharacters(allCharacters);
    });
  }

  if (btnMale) {
    btnMale.addEventListener("click", () => {
      setActiveBtn(btnMale);
      clearSearchInput();
      const onlyMen = allCharacters.filter(character => character.gender === "Male");
      renderCharacters(onlyMen);
    });
  }

  if (btnFemale) {
    btnFemale.addEventListener("click", () => {
      setActiveBtn(btnFemale);
      clearSearchInput();
      const onlyWomen = allCharacters.filter(character => character.gender === "Female");
      renderCharacters(onlyWomen);
    });
  }

  if (btnSaiyan) {
    btnSaiyan.addEventListener("click", () => {
      setActiveBtn(btnSaiyan);
      clearSearchInput();
      const onlySaiyan = allCharacters.filter(character => (character.race || "").toLowerCase() === "saiyan");
      renderCharacters(onlySaiyan);
    });
  }

  if (btnHuman) {
    btnHuman.addEventListener("click", () => {
      setActiveBtn(btnHuman);
      clearSearchInput();
      const onlyHuman = allCharacters.filter(character => (character.race || "").toLowerCase() === "human");
      renderCharacters(onlyHuman);
    });
  }

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

// navigation toggle for mobile
  const navToggle = document.querySelector('.nav-toggle');
  const navCollapse = document.querySelector('.nav-collapse');
  if (navToggle && navCollapse) {
    navToggle.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
    });
  }
});
