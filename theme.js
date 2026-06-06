(function() {
  var storageKey = "mark-sui-theme";
  var themeColors = {
    light: "#102A43",
    dark: "#0F1217"
  };

  function storedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      return;
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeColor(theme);
  }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", themeColors[theme] || themeColors.light);
    }
  }

  function updateButton(button, theme) {
    var icon = button.querySelector(".theme-toggle-icon");
    var label = button.querySelector(".theme-toggle-label");
    icon.textContent = theme === "dark" ? "\u2600" : "\u25d0";
    label.textContent = theme === "dark" ? "Light" : "Dark";
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
    button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function navigateWithTransition(href) {
    if (!href || prefersReducedMotion()) {
      window.location.href = href;
      return;
    }

    document.body.classList.add("site-exiting");
    window.setTimeout(function() {
      window.location.href = href;
    }, 150);
  }

  function showToast(message) {
    if (!message) {
      return;
    }

    var region = document.querySelector(".site-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "site-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }

    var toast = document.createElement("div");
    toast.className = "site-toast";
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(function() {
      toast.classList.add("is-visible");
    }, 16);
    window.setTimeout(function() {
      toast.classList.remove("is-visible");
      window.setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 220);
    }, 2600);
  }

  function copyText(value, successMessage) {
    if (!value) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function() {
        showToast(successMessage || "Copied.");
      }).catch(function() {
        fallbackCopy(value, successMessage);
      });
      return;
    }

    fallbackCopy(value, successMessage);
  }

  function fallbackCopy(value, successMessage) {
    var input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      showToast(successMessage || "Copied.");
    } catch (error) {
      showToast("Copy unavailable.");
    }
    document.body.removeChild(input);
  }

  function initFeedbackActions() {
    document.addEventListener("click", function(event) {
      var copyButton = event.target.closest && event.target.closest("[data-copy]");
      if (copyButton) {
        event.preventDefault();
        copyText(copyButton.getAttribute("data-copy"), copyButton.getAttribute("data-copy-message") || "Copied.");
        return;
      }

      var download = event.target.closest && event.target.closest("a[download]");
      if (download) {
        var label = download.getAttribute("data-toast") || "Download started.";
        showToast(label);
      }
    });
  }

  function initGlobalReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) {
      return;
    }

    document.body.classList.add("reveal-ready");
    items.forEach(function(item, index) {
      if (!item.style.getPropertyValue("--reveal-delay")) {
        item.style.setProperty("--reveal-delay", Math.min(index * 70, 280) + "ms");
      }
    });

    function show(item) {
      item.classList.add("is-visible");
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }

    window.setTimeout(function() {
      items.forEach(show);
    }, 1000);

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function(item) {
      observer.observe(item);
    });
  }

  function ensureSkipLink() {
    var main = document.querySelector("main");
    if (!main) {
      return;
    }

    if (!main.id) {
      main.id = "main-content";
    }

    if (document.querySelector(".skip-link")) {
      return;
    }

    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#" + main.id;
    skip.textContent = "Skip to main content";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function markCurrentNavLink() {
    var currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("header nav a[href]").forEach(function(link) {
      var href = link.getAttribute("href");
      if (!href || href.indexOf("#") === 0 || href.indexOf("http") === 0) {
        return;
      }

      var linkPath = href.split("#")[0].split("?")[0] || "index.html";
      if (linkPath === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function updateScrolledState() {
    document.body.classList.toggle("has-scrolled", window.scrollY > 12);
  }

  function enhancePageTransitions() {
    document.body.classList.add("site-ready");

    document.addEventListener("click", function(event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link || event.defaultPrevented) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (link.target || link.hasAttribute("download")) {
        return;
      }

      var href = link.getAttribute("href");
      if (!href || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
        return;
      }

      var nextUrl;
      try {
        nextUrl = new URL(href, window.location.href);
      } catch (error) {
        return;
      }

      if (nextUrl.origin !== window.location.origin) {
        return;
      }
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) {
        return;
      }

      event.preventDefault();
      navigateWithTransition(nextUrl.href);
    });
  }

  function enhanceDisclosureMenus() {
    document.addEventListener("keydown", function(event) {
      if (event.key !== "Escape") {
        return;
      }

      document.querySelectorAll("details[open]").forEach(function(details) {
        details.removeAttribute("open");
      });
    });
  }

  function createCommandPalette() {
    if (document.querySelector(".command-palette")) {
      return;
    }

    var commands = [
      { label: "Home", href: "index.html", meta: "Portfolio overview and engineering signals", group: "Pages", keywords: "about mark sui overview" },
      { label: "Projects", href: "projects.html", meta: "Case studies, filters, and supporting builds", group: "Pages", keywords: "work builds software hardware" },
      { label: "Experience", href: "experience.html", meta: "Research, industry, and technical work", group: "Pages", keywords: "work roles research" },
      { label: "Education", href: "education.html", meta: "UC San Diego ECE and academic path", group: "Pages", keywords: "school ucsd academics" },
      { label: "Resume Console", href: "resume.html", meta: "PDF preview, skill matrix, and download", group: "Resume", keywords: "cv download" },
      { label: "Contact Console", href: "contact.html", meta: "Email, profiles, and ready-to-contact paths", group: "Pages", keywords: "email linkedin contact" },
      { label: "Personal Archive", href: "personal.html", meta: "Archive dashboard and photo wall", group: "Travel", keywords: "photos personal archive" },
      { label: "Travel Gallery", href: "travel-gallery.html", meta: "Browse photo stream with viewer", group: "Travel", keywords: "photos gallery viewer" },
      { label: "Travel Map", href: "travel-map.html", meta: "Open atlas view", group: "Travel", keywords: "map places atlas" },
      { label: "Travel Tree", href: "travel-tree.html", meta: "Explore archive hierarchy", group: "Travel", keywords: "tree regions" },
      { label: "Collections", href: "travel-collections.html", meta: "Regional photo sets", group: "Travel", keywords: "sets collections" },
      { label: "Logic & CMOS Studio", href: "https://marksui.github.io/logic-cmos-studio/", meta: "Boolean logic, K-maps, Verilog, CMOS", group: "Projects", keywords: "eda rtl vlsi" },
      { label: "Hardware Interview Trainer", href: "https://marksui.github.io/Hardware_Interview_Trainer/", meta: "Hardware interview practice", group: "Projects", keywords: "questions prep" },
      { label: "MarkMacZip", href: "https://marksui.github.io/MacZip/", meta: "macOS archive utility", group: "Projects", keywords: "macos zip compression" },
      { label: "GitHub", href: "https://github.com/marksui", meta: "Open code profile", group: "Actions", keywords: "source repository" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/marksui6", meta: "Open professional profile", group: "Actions", keywords: "profile" },
      { label: "Download Resume", action: "download-resume", meta: "Save mark-sui-resume.pdf", group: "Resume", keywords: "cv pdf" },
      { label: "Copy Email", action: "copy-email", meta: "Copy tqsui619@gmail.com", group: "Actions", keywords: "mail contact" },
      { label: "Toggle Theme", action: "toggle-theme", meta: "Switch light or dark mode", group: "Actions", keywords: "dark light appearance" }
    ];

    var palette = document.createElement("div");
    palette.className = "command-palette";
    palette.setAttribute("role", "dialog");
    palette.setAttribute("aria-modal", "true");
    palette.setAttribute("aria-label", "Site search");
    palette.innerHTML = '' +
      '<div class="command-palette-panel">' +
        '<input type="search" autocomplete="off" spellcheck="false" aria-label="Search pages and projects" placeholder="Search pages and projects">' +
        '<ul class="command-palette-list"></ul>' +
      '</div>';
    document.body.appendChild(palette);

    var input = palette.querySelector("input");
    var list = palette.querySelector(".command-palette-list");
    var activeIndex = 0;
    var matches = [];

    function commandText(command) {
      return [command.label, command.meta, command.group, command.keywords].join(" ").toLowerCase();
    }

    function render() {
      var query = input.value.trim().toLowerCase();
      matches = commands.filter(function(command) {
        return !query || commandText(command).indexOf(query) >= 0;
      }).slice(0, 8);
      activeIndex = Math.min(activeIndex, Math.max(matches.length - 1, 0));

      if (!matches.length) {
        list.innerHTML = '<li class="command-empty">No matching destination.</li>';
        return;
      }

      list.innerHTML = matches.map(function(command, index) {
        var activeClass = index === activeIndex ? " is-active" : "";
        return '' +
          '<li>' +
            '<button class="command-palette-result' + activeClass + '" type="button" data-command-index="' + index + '">' +
              '<strong>' + escapeHtml(command.label) + '</strong>' +
              '<small>' + escapeHtml(command.group) + '</small>' +
              '<span>' + escapeHtml(command.meta) + '</span>' +
            '</button>' +
          '</li>';
      }).join("");
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function(character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[character];
      });
    }

    function openPalette() {
      palette.classList.add("open");
      activeIndex = 0;
      input.value = "";
      render();
      window.setTimeout(function() {
        input.focus();
      }, 0);
    }

    function closePalette() {
      palette.classList.remove("open");
      input.blur();
    }

    function executeAction(action) {
      if (action === "copy-email") {
        copyText("tqsui619@gmail.com", "Email copied.");
        return;
      }

      if (action === "download-resume") {
        var link = document.createElement("a");
        link.href = "files/mark-sui-resume.pdf";
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Resume download started.");
        return;
      }

      if (action === "toggle-theme") {
        var currentTheme = document.documentElement.getAttribute("data-theme");
        var nextTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        saveTheme(nextTheme);
        var button = document.querySelector(".theme-toggle");
        if (button) {
          updateButton(button, nextTheme);
        }
        showToast(nextTheme === "dark" ? "Dark mode on." : "Light mode on.");
      }
    }

    function activate(index) {
      var command = matches[index];
      if (!command) {
        return;
      }

      closePalette();
      if (command.action) {
        executeAction(command.action);
        return;
      }
      navigateWithTransition(command.href);
    }

    input.addEventListener("input", function() {
      activeIndex = 0;
      render();
    });

    input.addEventListener("keydown", function(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, matches.length - 1);
        render();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        render();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        activate(activeIndex);
      }
    });

    list.addEventListener("click", function(event) {
      var button = event.target.closest && event.target.closest("[data-command-index]");
      if (!button) {
        return;
      }
      activate(Number(button.getAttribute("data-command-index")));
    });

    palette.addEventListener("click", function(event) {
      if (event.target === palette) {
        closePalette();
      }
    });

    document.addEventListener("keydown", function(event) {
      var target = event.target;
      var isTyping = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
        return;
      }

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        openPalette();
      }
    });

    var header = document.querySelector("header");
    var nav = document.querySelector("header nav");
    if (header && nav && !document.querySelector(".command-trigger")) {
      var trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "command-trigger";
      trigger.textContent = "Search";
      trigger.setAttribute("aria-label", "Open site search");
      trigger.addEventListener("click", openPalette);
      header.insertBefore(trigger, nav);
    }
  }

  var initialTheme = storedTheme() || "light";
  setTheme(initialTheme);

  document.addEventListener("DOMContentLoaded", function() {
    if (!document.body) {
      return;
    }

    ensureSkipLink();
    markCurrentNavLink();
    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    enhancePageTransitions();
    enhanceDisclosureMenus();
    initFeedbackActions();
    initGlobalReveal();
    createCommandPalette();

    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    var icon = document.createElement("span");
    icon.className = "theme-toggle-icon";
    icon.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "theme-toggle-label";
    button.appendChild(icon);
    button.appendChild(label);
    updateButton(button, document.documentElement.getAttribute("data-theme"));

    button.addEventListener("click", function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var nextTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      saveTheme(nextTheme);
      updateButton(button, nextTheme);
      showToast(nextTheme === "dark" ? "Dark mode on." : "Light mode on.");
    });

    var nav = document.querySelector("header nav");
    var header = document.querySelector("header");
    if (header && nav) {
      header.insertBefore(button, nav);
      return;
    }

    (header || document.body).appendChild(button);
  });

  window.siteToast = showToast;
  window.siteCopyText = copyText;
})();
