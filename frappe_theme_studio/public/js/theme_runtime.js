(function () {
  function loadThemeCss() {
    var id = "frappe-theme-studio-css";
    var href = "/api/method/frappe_theme_studio.api.get_active_theme_css";
    var existing = document.getElementById(id);

    if (existing) {
      existing.href = href + "?v=" + Date.now();
      return;
    }

    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadThemeCss);
  } else {
    loadThemeCss();
  }

  window.frappe_theme_studio_refresh = loadThemeCss;
})();
