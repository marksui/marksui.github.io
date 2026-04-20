(function() {
  var storageKey = "mark-sui-theme";

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
  }

  function updateButton(button, theme) {
    button.textContent = theme === "dark" ? "Light" : "Dark";
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  var initialTheme = storedTheme() || "light";
  setTheme(initialTheme);

  document.addEventListener("DOMContentLoaded", function() {
    var header = document.querySelector("header");
    if (!header) {
      return;
    }

    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    updateButton(button, document.documentElement.getAttribute("data-theme"));

    button.addEventListener("click", function() {
      var currentTheme = document.documentElement.getAttribute("data-theme");
      var nextTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      saveTheme(nextTheme);
      updateButton(button, nextTheme);
    });

    header.appendChild(button);
  });
})();
