import { bangs } from "./bang";
import "./global.css";

const initialTheme = getTheme();
setTheme(initialTheme);

function setTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function getTheme(): 'light' | 'dark' {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    return savedTheme;
  }
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

function toggleTheme() {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme: 'light' | 'dark') {
  const themeToggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
  if (!themeToggle) return;
  
  const iconSrc = theme === 'light' ? '/moon.svg' : '/sun.svg';
  const iconAlt = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  
  themeToggle.innerHTML = `<img src="${iconSrc}" alt="${iconAlt}" />`;
}

function noSearchDefaultPageRender() {
  const initialTheme = getTheme();
  setTheme(initialTheme);

  const app = document.querySelector<HTMLDivElement>("#app")!;

  const currentDefault = localStorage.getItem("default-bang") ?? "g";

  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <button class="theme-toggle" aria-label="Toggle dark mode">
        <img src="${initialTheme === 'light' ? '/moon.svg' : '/sun.svg'}" alt="${initialTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}" />
      </button>
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://unduck.jnz.ski?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <div class="center-container">
          <div class="engine-container">
            <div class="dropdown-container">
              <div class="engine-text">
                Default Engine:
              </div>
              <select class="engine-selector" class="engine-selector">
                <!-- Options will be populated by JavaScript -->
              </select>
              <button class="submit-button">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer class="footer">
        <a href="https://bsky.app/profile/jnz.ski" target="_blank">jonas</a>
        •
        <a href="https://github.com/jnzd/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const themeToggle = app.querySelector<HTMLButtonElement>(".theme-toggle")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    copyButton.classList.add("copied");

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
      copyButton.classList.remove("copied");
    }, 2000);
  });

  themeToggle.addEventListener("click", toggleTheme);

  // Deafault Engine Selector
  const engineSelector = app.querySelector<HTMLSelectElement>(".engine-selector")!;
  populateEngineDropdown(engineSelector, currentDefault);

  const submitButton = app.querySelector<HTMLButtonElement>(".submit-button")!;
  submitButton.addEventListener("click", () => {
    const selectedEngine = engineSelector.value;
    localStorage.setItem("default-bang", selectedEngine);
    showSavedMessage();
  });


  function showSavedMessage() {
    const existingMessage = app.querySelector(".saved-message");
    if (existingMessage) existingMessage.remove();
    
    const message = document.createElement("div");
    message.className = "saved-message";
    message.textContent = "Default engine saved!";
    app.querySelector(".engine-container")!.appendChild(message);
    
    setTimeout(() => message.remove(), 2000);
  }
}

function populateEngineDropdown(selectElement: HTMLSelectElement, currentDefault: string) {
  const commonEngines = [
    { t: "g", d: "Google"},
    { t: "ddg", d: "DuckDuckGo"},
    { t: "b", d: "Bing"},
    { t: "brave", d: "Brave"},
    { t: "y", d: "Yahoo"},
    { t: "yt", d: "YouTube"},
    { t: "w", d: "Wikipedia"},
    { t: "gh", d: "GitHub"},
    { t: "spen", d: "StartPage (English)"},
    { t: "a", d: "Amazon"},
    { t: "r", d: "Reddit"}
  ];

  const commonGroup = document.createElement("optgroup");
  commonGroup.label = "Engines";
  
  commonEngines.forEach(engine => {
    const option = document.createElement("option");
    option.value = engine.t;
    option.textContent = `${engine.d} (!${engine.t})`;
    option.selected = engine.t === currentDefault;
    commonGroup.appendChild(option);
  });
  
  selectElement.appendChild(commonGroup);
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  // Match both !bang and bang! formats
  const prefixMatch = query.match(/!(\S+)/i);
  const suffixMatch = query.match(/(\S+)!/);

  const bangCandidate = (prefixMatch?.[1] ?? suffixMatch?.[1])?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the bang from either position
  const cleanQuery = query
    .replace(/!\S+\s*/i, "") // Remove prefix bang
    .replace(/\s*\S+!/, "") // Remove suffix bang
    .trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
