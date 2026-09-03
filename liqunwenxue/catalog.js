const collections = [
  { id: "works", label: "文学作品", folder: "吴利群-陈景棋", extensions: ["jpg", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "jpg", "png", "png", "jpg", "png", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "png", "png", "jpg", "png", "png", "png", "png", "png", "jpg", "jpg", "jpg", "png", "png", "png", "jpg", "png", "png", "jpg", "jpg", "png", "png", "png", "png", "png", "png", "jpg"] },
  { id: "university", label: "机构文献", folder: "利群大学", extensions: ["png", "png", "png", "png", "png"] },
  { id: "pirated", label: "资料附件", folder: "盗版书", extensions: ["png"] },
  { id: "fan", label: "资料附件", folder: "阿群同人", extensions: ["png"] },
  { id: "materials", label: "资料附件", folder: "阿群素材", extensions: ["png", "png", "png", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "png", "png", "png", "png", "png", "png", "png", "png", "jpg", "jpg", "png", "jpg", "png", "png"] },
  { id: "front", label: "资料附件", folder: "首页", extensions: ["jpg", "jpg", "jpg", "jpg", "png", "jpg", "png", "jpg"] }
];

const primaryWorkIndices = new Set([15, 16, 19, ...Array.from({ length: 31 }, (_, index) => index + 26)]);
const universityTitles = [
  "录取通知书",
  "利群大学的九十年：改革开放和社会主义现代化建设新时期",
  "利群大学的九十年：社会主义革命和建设时期",
  "利群大学的九十年：中国抗日战争与旧民主主义革命时期",
  "利群大学的九十年：新民主主义革命时期"
];
const pad = (number) => String(number).padStart(3, "0");

const books = collections.flatMap((collection) => collection.extensions.map((extension, index) => {
  const bookIndex = index + 1;
  const primary = collection.id === "university" || (collection.id === "works" && primaryWorkIndices.has(bookIndex));
  return {
    ...collection,
    index: bookIndex,
    primary,
    archiveGroup: collection.id === "works" ? "early" : "attachments",
    title: collection.id === "university" ? universityTitles[index] : "",
    src: `../img/liqunwenxue/${encodeURIComponent(collection.folder)}/${pad(bookIndex)}.${extension}`
  };
}));

const primaryGroups = [
  { id: "works", label: "文学作品" },
  { id: "university", label: "机构文献" }
];
const archiveGroups = [
  { id: "early", label: "早期版本" },
  { id: "attachments", label: "资料附件" }
];
const primaryBooks = books.filter((book) => book.primary);
const archiveBooks = books.filter((book) => !book.primary);

const shelves = document.querySelector("#shelves");
const filters = document.querySelector("#filters");
const count = document.querySelector("#book-count");
const archiveAnnex = document.querySelector("#archive-annex");
const archiveShelves = document.querySelector("#archive-shelves");
const archiveFilters = document.querySelector("#archive-filters");
const archiveCount = document.querySelector("#archive-count");
const viewer = document.querySelector("#viewer");
const viewerImage = document.querySelector("#viewer-image");
const viewerTitle = document.querySelector("#viewer-title");
const closeViewer = document.querySelector(".close-viewer");

function groupId(book, archive) {
  return archive ? book.archiveGroup : book.id;
}

function groupLabel(book, archive) {
  if (!archive) {
    return book.label;
  }
  return book.archiveGroup === "early" ? "早期版本" : "资料附件";
}

function bookTitle(book, archive) {
  return book.title || `${groupLabel(book, archive)} · 编目 ${pad(book.index)}`;
}

function openViewer(book, archive) {
  const label = groupLabel(book, archive);
  viewerImage.src = book.src;
  viewerImage.alt = bookTitle(book, archive);
  viewerTitle.textContent = bookTitle(book, archive);
  viewer.showModal();
  closeViewer.focus();
}

function renderShelves(target, groups, items, archive = false) {
  target.replaceChildren();
  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "shelf-section";
    section.dataset.collection = group.id;
    section.innerHTML = `<h3 class="section-title">${group.label}</h3><div class="shelf"></div>`;
    const shelf = section.querySelector(".shelf");
    items.filter((book) => groupId(book, archive) === group.id).forEach((book) => {
      const label = groupLabel(book, archive);
      const button = document.createElement("button");
      button.className = "book";
      button.type = "button";
      const title = bookTitle(book, archive);
      button.setAttribute("aria-label", `查看${title}`);
      button.innerHTML = `<span class="cover"><img src="${book.src}" alt="${title}" loading="lazy"></span><span class="book-label">${title}</span>`;
      button.addEventListener("click", () => openViewer(book, archive));
      shelf.append(button);
    });
    target.append(section);
  });
}

function renderFilters(target, groups, shelfTarget) {
  [{ id: "all", label: "全部" }, ...groups].forEach((filter, index) => {
    const button = document.createElement("button");
    button.className = "filter";
    button.type = "button";
    button.dataset.filter = filter.id;
    button.textContent = filter.label;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      target.querySelectorAll(".filter").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      shelfTarget.querySelectorAll(".shelf-section").forEach((section) => {
        section.hidden = filter.id !== "all" && section.dataset.collection !== filter.id;
      });
    });
    target.append(button);
  });
}

let archiveRendered = false;
archiveAnnex.addEventListener("toggle", () => {
  if (!archiveAnnex.open || archiveRendered) {
    return;
  }
  renderFilters(archiveFilters, archiveGroups, archiveShelves);
  renderShelves(archiveShelves, archiveGroups, archiveBooks, true);
  archiveRendered = true;
});

closeViewer.addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close(); });
count.textContent = `${primaryBooks.length} 部正式馆藏`;
archiveCount.textContent = `${archiveBooks.length} 项历史附件`;
renderFilters(filters, primaryGroups, shelves);
renderShelves(shelves, primaryGroups, primaryBooks);
