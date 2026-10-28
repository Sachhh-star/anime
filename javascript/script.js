// homepage: all characters with search, filter buttons and A-Z letters

let allCharacters = [];

// show a list of characters as cards on the page
function renderCharacters(characters) {
  const result = document.getElementById("resultaat");
  result.innerHTML = "";

  if (characters.length === 0) {
    result.innerHTML = `<p class="text-gold text-center no-results">Geen legendarische krijgers gevonden met dit filter!</p>`;
    return;
  }

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const card = document.createElement("div");
    card.className = "charac";

    // the first 4 images load right away, the rest only when you scroll to them
    const loading = i < 4 ? 'fetchpriority="high"' : 'loading="lazy"';

    card.innerHTML = `
      <img src="${character.image}" alt="${character.name}" width="200" height="260" ${loading} />
      <h2>${character.name}</h2>
      <p class="race-subtitle">${character.race}</p>
    `;

    card.addEventListener("click", function () {
      openModal(character);
    });

    result.appendChild(card);
  }
}

// make only the given buttons orange (active)
function setActive(...buttons) {
  const allButtons = document.querySelectorAll(".filter-btn, .alpha-btn");
  for (let button of allButtons) {
    button.classList.remove("active");
  }
  for (let button of buttons) {
    button.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const result = document.getElementById("resultaat");
  const searchBar = document.getElementById("zoekBar");
  const alphabetFilter = document.getElementById("alphabet-filter");
  const btnAll = document.getElementById("btn-all");

  // 1. load the characters from the API
  result.innerHTML = `<p class="text-gold text-center">Gathering Ki Energy...</p>`;

  try {
    allCharacters = await getCharacters();
  } catch (error) {
    console.error(error);
    result.innerHTML = `<p class="text-red text-center">Er is een fout opgetreden bij het laden van de Ki-krijgers.</p>`;
    return;
  }

  renderCharacters(allCharacters);

  // 2. the "All" button in the A-Z row
  const alphaAll = document.createElement("button");
  alphaAll.className = "alpha-btn alpha-all active";
  alphaAll.textContent = "All";
  alphaAll.addEventListener("click", function () {
    setActive(btnAll, alphaAll);
    searchBar.value = "";
    renderCharacters(allCharacters);
  });
  alphabetFilter.appendChild(alphaAll);

  // 3. a button for every letter that has at least one character
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let letter of letters) {
    const withLetter = allCharacters.filter(function (character) {
      return character.name.trim().toUpperCase().startsWith(letter);
    });

    if (withLetter.length === 0) {
      continue;
    }

    const button = document.createElement("button");
    button.className = "alpha-btn";
    button.textContent = letter;
    button.addEventListener("click", function () {
      setActive(button);
      searchBar.value = "";
      renderCharacters(withLetter);
    });
    alphabetFilter.appendChild(button);
  }

  // 4. the filter buttons: All, Male, Female, Saiyan, Human
  function addFilter(buttonId, checkCharacter) {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", function () {
      setActive(button, alphaAll);
      searchBar.value = "";
      renderCharacters(allCharacters.filter(checkCharacter));
    });
  }

  addFilter("btn-all", function (character) { return true; });
  addFilter("btn-male", function (character) { return character.gender === "Male"; });
  addFilter("btn-female", function (character) { return character.gender === "Female"; });
  addFilter("btn-saiyan", function (character) { return character.race === "Saiyan"; });
  addFilter("btn-human", function (character) { return character.race === "Human"; });

  // 5. search on name or race while you type
  searchBar.addEventListener("input", function () {
    const text = searchBar.value.toLowerCase().trim();

    const found = allCharacters.filter(function (character) {
      return character.name.toLowerCase().includes(text) || character.race.toLowerCase().includes(text);
    });

    setActive(btnAll, alphaAll);
    renderCharacters(found);
  });
});
