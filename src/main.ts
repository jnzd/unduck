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
  
  themeToggle.innerHTML = /*html*/ `<img src="${iconSrc}" alt="${iconAlt}" />`;
}

function noSearchDefaultPageRender() {
  const initialTheme = getTheme();
  setTheme(initialTheme);

  const app = document.querySelector<HTMLDivElement>("#app")!;

  const currentDefault = localStorage.getItem("default-bang") ?? "g";
  const currentDefaultEngine = bangs.find(b => b.t === currentDefault)?.s ?? "Google";
  const isCollapsedInitial = localStorage.getItem("engine-list-collapsed") === "true";

  app.innerHTML = /*html*/ `
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
        <div class="search-bar-container">
          <input
            type="search"
            id="main-search"
            class="search-input"
            placeholder="Search with Unduck..."
          />
          <button class="search-button" aria-label="Start search">
            <img src="/search-icon.svg" alt="Search" />
          </button>
        </div>
        <div class="center-container">
          <div class="engine-container">
            <div class="search-container">
              <div id="current-engine">Current Search Engine: ${currentDefaultEngine}</div>
              <input type="text" id="engine-search" placeholder="Change Default Search Engine" />
              <button id="collapse-button">${isCollapsedInitial ? "Expand results" : "Collapse results"}</button>
              <ul id="engine-list" class="${isCollapsedInitial ? "collapsed" : ""}"></ul>
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

  const searchInput = app.querySelector<HTMLInputElement>("#engine-search")!;
  const engineList = app.querySelector<HTMLUListElement>("#engine-list")!;
  const collapseButton = app.querySelector<HTMLButtonElement>("#collapse-button")!;
  const mainSearchInput = app.querySelector<HTMLInputElement>("#main-search")!;
  const searchButton = app.querySelector<HTMLButtonElement>(".search-button")!;

  searchButton.addEventListener("click", () => {
    const searchTerm = mainSearchInput.value.trim();
    if (searchTerm) {
      window.location.href = `/?q=${encodeURIComponent(searchTerm)}`;
    }
  });

  let timeoutId: number;
  let isCollapsed = isCollapsedInitial;

  const updateCollapseState = (collapsed: boolean) => {
    isCollapsed = collapsed;
    engineList.classList.toggle("collapsed", collapsed);
    collapseButton.textContent = collapsed ? "Expand results" : "Collapse results";
    localStorage.setItem("engine-list-collapsed", collapsed.toString());
  };

  collapseButton.addEventListener("click", () => {
    updateCollapseState(!isCollapsed);
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const searchTerm = searchInput.value.toLowerCase();
      let filteredEngines = bangs.filter(bang =>
        bang.t.toLowerCase().includes(searchTerm)
        || (searchTerm[0] == "!" && bang.t.toLowerCase().includes(searchTerm.slice(1)))
        || bang.s.toLowerCase().includes(searchTerm)
        || bang.d.toLowerCase().includes(searchTerm)
      );

      // Sort by length of 't' value
      filteredEngines.sort((a, b) => a.t.length - b.t.length);

      engineList.innerHTML = "";
      filteredEngines.slice(0, 250).forEach(engine => {
        const listItem = document.createElement("li");
        listItem.innerHTML = /*html*/ `${engine.s} <span class="bang-text">!${engine.t}</span>`;
        listItem.addEventListener("click", () => {
          localStorage.setItem("default-bang", engine.t);
          showSavedMessage(engine.t);
          // Update current engine display
          const currentEngineDisplay = app.querySelector<HTMLDivElement>("#current-engine")!;
          currentEngineDisplay.textContent = `Current search engine: ${engine.s}`;
          updateCollapseState(true);
        });
        engineList.appendChild(listItem);
      });
      updateCollapseState(false);
    }, 200); // Delay of 200ms
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      updateCollapseState(false);
    } else if (event.key === "Escape") {
      updateCollapseState(true);
      searchInput.blur(); // Remove focus from the input
    }
  });

  mainSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const searchTerm = mainSearchInput.value.trim();
      if (searchTerm) {
        window.location.href = `/?q=${encodeURIComponent(searchTerm)}`;
      }
    }
  });

  function showSavedMessage(selectedEngine: string) {
    const existingMessage = app.querySelector(".saved-message");
    if (existingMessage) existingMessage.remove();
    
    const message = document.createElement("div");
    message.className = "saved-message";
    message.textContent = "Set default engine to " + bangs.find((b) => b.t === selectedEngine)?.s;
    app.querySelector(".engine-container")!.appendChild(message);
    
    setTimeout(() => message.remove(), 2000);
  }
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
