const collections = [
  { id: "works", label: "吴利群 · 陈景棋", folder: "吴利群-陈景棋", extensions: ["jpg", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "jpg", "png", "png", "jpg", "png", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "png", "png", "jpg", "png", "png", "png", "png", "png", "jpg", "jpg", "jpg", "png", "png", "png", "jpg", "png", "png", "jpg", "jpg", "png", "png", "png", "png", "png", "png", "jpg"] },
  { id: "university", label: "利群大学", folder: "利群大学", extensions: ["png", "png", "png", "png", "png"] },
  { id: "pirated", label: "盗版书", folder: "盗版书", extensions: ["png"] },
  { id: "fan", label: "阿群同人", folder: "阿群同人", extensions: ["png"] },
  { id: "materials", label: "阿群素材", folder: "阿群素材", extensions: ["png", "png", "png", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "png", "png", "png", "png", "png", "png", "png", "jpg", "jpg", "png", "jpg", "png", "png"] },
  { id: "front", label: "首页收藏", folder: "首页", extensions: ["jpg", "jpg", "jpg", "jpg", "png", "jpg", "png", "jpg"] }
];

const pad = (number) => String(number).padStart(3, "0");
const books = collections.flatMap((collection) => collection.extensions.map((extension, index) => ({
  ...collection,
  index: index + 1,
  src: `../img/liqunwenxue/${encodeURIComponent(collection.folder)}/${pad(index + 1)}.${extension}`
})));

const shelves = document.querySelector("#shelves");
const filters = document.querySelector("#filters");
const count = document.querySelector("#book-count");
const viewer = document.querySelector("#viewer");
const viewerImage = document.querySelector("#viewer-image");
const viewerTitle = document.querySelector("#viewer-title");
const closeViewer = document.querySelector(".close-viewer");

function openViewer(book) {
  viewerImage.src = book.src;
  viewerImage.alt = `${book.label}图书封面 ${pad(book.index)}`;
  viewerTitle.textContent = `${book.label} · 图书 ${pad(book.index)}`;
  viewer.showModal();
  closeViewer.focus();
}

function renderShelves() {
  collections.forEach((collection) => {
    const section = document.createElement("section");
    section.className = "shelf-section";
    section.dataset.collection = collection.id;
    section.innerHTML = `<h3 class="section-title">${collection.label}</h3><div class="shelf"></div>`;
    const shelf = section.querySelector(".shelf");
    books.filter((book) => book.id === collection.id).forEach((book) => {
      const button = document.createElement("button");
      button.className = "book";
      button.type = "button";
      button.setAttribute("aria-label", `查看${book.label}图书 ${pad(book.index)}`);
      button.innerHTML = `<span class="cover"><img src="${book.src}" alt="${book.label}图书封面 ${pad(book.index)}" loading="lazy"></span><span class="book-label">${book.label} · ${pad(book.index)}</span>`;
      button.addEventListener("click", () => openViewer(book));
      shelf.append(button);
    });
    shelves.append(section);
  });
}

function renderFilters() {
  [{ id: "all", label: "全部" }, ...collections.map(({ id, label }) => ({ id, label }))].forEach((filter, index) => {
    const button = document.createElement("button");
    button.className = "filter";
    button.type = "button";
    button.dataset.filter = filter.id;
    button.textContent = filter.label;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelectorAll(".shelf-section").forEach((section) => {
        section.hidden = filter.id !== "all" && section.dataset.collection !== filter.id;
      });
    });
    filters.append(button);
  });
}

closeViewer.addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
count.textContent = `${books.length} 本图书与资料`;
renderFilters();
renderShelves();
