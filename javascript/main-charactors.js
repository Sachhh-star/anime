// main characters page: only Goku, Vegeta, Gohan, Piccolo and Trunks

const mainNames = ["Goku", "Vegeta", "Gohan", "Piccolo", "Trunks"];

// show the main characters as big cards with a Ki bar
function showMainCharacters(characters) {
  const grid = document.getElementById("characters-grid");
  grid.innerHTML = "";

  for (let name of mainNames) {
    const character = characters.find(function (character) {
      return character.name.trim() === name;
    });

    if (!character) {
      continue;
    }

    const card = document.createElement("div");
    card.className = "character-card";
    card.innerHTML = `
      <div class="image-container">
        <img src="${character.image}" alt="${character.name}" width="200" height="260" fetchpriority="high" />
      </div>
      <div class="card-content">
        <span class="card-race">${character.race}</span>
        <h2 class="card-name">${character.name}</h2>

        <div class="card-ki-container">
          <div class="ki-bar-header">
            <span class="ki-label">Ki Power Level</span>
            <span class="ki-value">${character.ki} / ${character.maxKi}</span>
          </div>
          <div class="ki-bar-bg">
            <div class="ki-bar-fill" style="width: ${kiPercent(character)}%;"></div>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", function () {
      openModal(character);
    });

    grid.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const grid = document.getElementById("characters-grid");

  try {
    const characters = await getCharacters();
    showMainCharacters(characters);
    grid.classList.remove("hide");
  } catch (problem) {
    console.error(problem);
    error.classList.remove("hide");
  }

  loading.classList.add("hide");
});
