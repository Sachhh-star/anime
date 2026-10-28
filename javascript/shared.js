// shared code for both pages: the API call, Ki calculation and the modal

const API_URL = "https://dragonball-api.com/api/characters?limit=100";
const CACHE_KEY = "db_characters_cache";

// get the characters from the API and save them in localStorage
async function fetchCharacters() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("API error. Status: " + response.status);
  }

  const data = await response.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify(data.items));
  return data.items;
}

// use the saved characters if we have them (fast), otherwise wait for the API
async function getCharacters() {
  const cache = localStorage.getItem(CACHE_KEY);

  if (cache) {
    // update the saved characters in the background for next time
    fetchCharacters().catch(function (error) {
      console.warn("Could not update the cache:", error);
    });
    return JSON.parse(cache);
  }

  return await fetchCharacters();
}

// big number words from the API, for example "90 Septillion"
const kiWords = {
  googol: 1e100,
  septillion: 1e24,
  sextillion: 1e21,
  quintillion: 1e18,
  quadrillion: 1e15,
  trillion: 1e12,
  billion: 1e9,
  million: 1e6,
};

// turn a Ki text like "60.000.000" or "90 Septillion" into a number
function kiToNumber(ki) {
  let text = String(ki).toLowerCase().replaceAll(".", "").replaceAll(",", "");
  let multiplier = 1;

  for (let word in kiWords) {
    if (text.includes(word)) {
      multiplier = kiWords[word];
      break;
    }
  }

  const number = parseFloat(text);
  if (isNaN(number)) {
    return 0;
  }
  return number * multiplier;
}

// how full the Ki bar is: ki compared to maxKi, from 5 to 100 (5 so you can always see the bar)
function kiPercent(character) {
  const ki = kiToNumber(character.ki);
  const maxKi = kiToNumber(character.maxKi);

  if (maxKi > 0) {
    return Math.max(5, Math.min(100, (ki / maxKi) * 100));
  }
  if (ki > 0) {
    return 85;
  }
  return 0;
}

// show the modal with all information about one character
function openModal(character) {
  document.getElementById("modal-img").src = character.image;
  document.getElementById("modal-img").alt = character.name;
  document.getElementById("modal-name").textContent = character.name;
  document.getElementById("modal-race").textContent = character.race || "Onbekend";
  document.getElementById("modal-gender").textContent = character.gender || "Onbekend";
  document.getElementById("modal-series").textContent = character.series || "Dragon Ball";
  document.getElementById("modal-description").textContent =
    character.description || "Geen verdere informatie beschikbaar over deze krijger.";
  document.getElementById("modal-ki").textContent = character.ki;
  document.getElementById("modal-maxKi").textContent = character.maxKi;
  document.getElementById("modal-ki-fill").style.width = kiPercent(character) + "%";

  document.getElementById("characterModal").classList.remove("hide-modal");
}

function closeModal() {
  document.getElementById("characterModal").classList.add("hide-modal");
}

// close the modal with the × button, a click next to it, or the Escape key
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", closeModal);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });
});
