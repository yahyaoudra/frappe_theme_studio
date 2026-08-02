frappe.pages["theme-studio"].on_page_load = function (wrapper) {
  frappe.theme_studio = new ThemeStudio(wrapper);
};

const COLOR_FIELDS = [
  "background",
  "surface",
  "panel",
  "text",
  "muted",
  "primary",
  "accent",
  "success",
  "border",
  "sidebar",
  "sidebar_text",
  "navbar",
];

const NUMERIC_FIELDS = [
  ["font_weight", "Font Weight", 350, 750, 50],
  ["button_radius", "Button Radius", 0, 16, 1],
  ["card_radius", "Card Radius", 0, 16, 1],
  ["density", "Density", 7, 18, 1],
  ["shadow", "Shadow", 0, 40, 1],
];

class ThemeStudio {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.page = frappe.ui.make_app_page({
      parent: wrapper,
      title: __("Theme Studio"),
      single_column: true,
    });
    this.mode = "light";
    this.device = "desktop";
    this.themes = [];
    this.versions = [];
    this.selected = null;
    this.draft = null;
    this.history = [];
    this.future = [];
    this.make();
    this.load();
  }

  make() {
    this.page.main.addClass("fts-page");
    this.page.main.html(`
      <div class="fts-shell">
        <aside class="fts-library">
          <div class="fts-brand">
            <div class="fts-mark">FT</div>
            <div>
              <h2>${__("Frappe Theme Studio")}</h2>
              <p>${__("Visual Desk customization")}</p>
            </div>
          </div>
          <div class="fts-library-actions">
            <button class="btn btn-primary btn-sm" data-action="create">${__("Create")}</button>
            <button class="btn btn-default btn-sm" data-action="import">${__("Import")}</button>
          </div>
          <input class="fts-search" placeholder="${__("Search themes")}" />
          <div class="fts-theme-list"></div>
        </aside>
        <section class="fts-workspace">
          <header class="fts-top">
            <div>
              <p>${__("Current Theme")}</p>
              <h2 data-bind="title"></h2>
            </div>
            <div class="fts-actions">
              <button class="btn btn-default btn-sm" data-action="undo">${__("Undo")}</button>
              <button class="btn btn-default btn-sm" data-action="redo">${__("Redo")}</button>
              <button class="btn btn-default btn-sm" data-action="duplicate">${__("Duplicate")}</button>
              <button class="btn btn-default btn-sm" data-action="export">${__("Export")}</button>
              <button class="btn btn-default btn-sm" data-action="save">${__("Save Draft")}</button>
              <button class="btn btn-default btn-sm" data-action="deactivate">${__("Deactivate")}</button>
              <button class="btn btn-primary btn-sm" data-action="publish">${__("Publish")}</button>
            </div>
          </header>
          <div class="fts-meta"></div>
          <div class="fts-grid">
            <aside class="fts-controls">
              <div class="fts-sections"></div>
              <div class="fts-panel" data-panel="controls"></div>
              <div class="fts-panel">
                <h3>${__("Version History")}</h3>
                <div class="fts-version-list"></div>
              </div>
            </aside>
            <section class="fts-preview-wrap">
              <div class="fts-preview-tools">
                <div class="fts-segment" data-segment="device">
                  <button data-device="desktop">Desktop</button>
                  <button data-device="tablet">Tablet</button>
                  <button data-device="mobile">Mobile</button>
                </div>
                <div class="fts-segment" data-segment="mode">
                  <button data-mode="light">Light</button>
                  <button data-mode="dark">Dark</button>
                </div>
                <button class="btn btn-danger btn-sm" data-action="delete">${__("Delete")}</button>
              </div>
              <div class="fts-preview"></div>
            </section>
          </div>
        </section>
      </div>
      <input type="file" class="hidden" data-role="import-file" accept="application/json" />
    `);
    this.bind();
  }

  bind() {
    this.$ = this.page.main.find.bind(this.page.main);
    this.$('[data-action="create"]').on("click", () => this.create());
    this.$('[data-action="import"]').on("click", () => this.$('[data-role="import-file"]').trigger("click"));
    this.$('[data-action="duplicate"]').on("click", () => this.duplicate());
    this.$('[data-action="export"]').on("click", () => this.export());
    this.$('[data-action="save"]').on("click", () => this.save());
    this.$('[data-action="publish"]').on("click", () => this.publish());
    this.$('[data-action="deactivate"]').on("click", () => this.deactivate());
    this.$('[data-action="delete"]').on("click", () => this.delete());
    this.$('[data-action="undo"]').on("click", () => this.undo());
    this.$('[data-action="redo"]').on("click", () => this.redo());
    this.$(".fts-search").on("input", () => this.renderList());
    this.$('[data-role="import-file"]').on("change", (event) => this.import(event));
    this.$('[data-segment="device"] button').on("click", (event) => {
      this.device = event.currentTarget.dataset.device;
      this.renderPreview();
    });
    this.$('[data-segment="mode"] button').on("click", (event) => {
      this.mode = event.currentTarget.dataset.mode;
      this.renderControls();
      this.renderPreview();
    });
  }

  async load() {
    const response = await frappe.call("frappe_theme_studio.api.get_studio_state");
    this.themes = response.message.themes || [];
    this.versions = response.message.versions || [];
    this.selected = this.themes[0];
    this.draft = this.clone(this.selected);
    this.render();
  }

  render() {
    this.renderList();
    this.renderHeader();
    this.renderSections();
    this.renderControls();
    this.renderVersions();
    this.renderPreview();
  }

  renderList() {
    const query = (this.$(".fts-search").val() || "").toLowerCase();
    const rows = this.themes
      .filter((theme) => !query || theme.theme_name.toLowerCase().includes(query))
      .map((theme) => `
        <button class="fts-theme-row ${theme.name === this.selected?.name ? "active" : ""}" data-theme="${this.escape(theme.name)}">
          <span class="fts-thumb" style="background:linear-gradient(135deg,${theme.light_sidebar} 0 34%,${theme.light_surface} 34% 68%,${theme.light_primary} 68%)"></span>
          <span>
            <strong>${this.escape(theme.theme_name)}</strong>
            <small>${theme.is_active ? __("Active") : theme.status} · ${this.prettyDate(theme.modified)}</small>
          </span>
        </button>
      `)
      .join("");
    this.$(".fts-theme-list").html(rows);
    this.$(".fts-theme-row").on("click", (event) => {
      this.selected = this.themes.find((theme) => theme.name === event.currentTarget.dataset.theme);
      this.draft = this.clone(this.selected);
      this.history = [];
      this.future = [];
      this.render();
    });
  }

  renderHeader() {
    this.$('[data-bind="title"]').text(this.draft?.theme_name || __("Untitled Theme"));
    const meta = [
      [__("Status"), this.draft.is_active ? __("Active") : this.draft.status],
      [__("Owner"), this.draft.owner],
      [__("Mode"), this.draft.mode],
      [__("Modified"), this.prettyDate(this.draft.modified)],
    ];
    this.$(".fts-meta").html(meta.map(([label, value]) => `<div><small>${label}</small><strong>${value || "-"}</strong></div>`).join(""));
  }

  renderSections() {
    const sections = ["Brand", "Typography", "Surfaces", "Sidebar", "Navbar", "Components", "Advanced"];
    if (!this.section) this.section = "Brand";
    this.$(".fts-sections").html(sections.map((section) => `<button class="${section === this.section ? "active" : ""}" data-section="${section}">${__(section)}</button>`).join(""));
    this.$(".fts-sections button").on("click", (event) => {
      this.section = event.currentTarget.dataset.section;
      this.renderSections();
      this.renderControls();
    });
  }

  renderControls() {
    const panel = this.$('[data-panel="controls"]');
    const colorRows = (scope) =>
      COLOR_FIELDS.map((field) => this.colorField(`${scope}_${field}`, this.labelize(field))).join("");
    const html = {
      Brand: `
        ${this.textField("theme_name", __("Theme Name"))}
        ${this.fileField("logo", __("Logo"))}
        ${this.textField("logo_text", __("Logo Text"))}
        ${this.fileField("favicon", __("Favicon"))}
        ${this.textField("favicon_text", __("Favicon Text"))}
        ${this.colorField(`${this.mode}_primary`, __("Brand Color"))}
        ${this.colorField(`${this.mode}_accent`, __("Accent Color"))}
      `,
      Typography: `
        ${this.textField("font_family", __("Default Font"))}
        ${this.rangeField("font_weight", __("Font Weight"), 350, 750, 50)}
      `,
      Surfaces: colorRows(this.mode),
      Sidebar: `
        ${this.colorField(`${this.mode}_sidebar`, __("Sidebar"))}
        ${this.colorField(`${this.mode}_sidebar_text`, __("Sidebar Text"))}
        ${this.rangeField("density", __("Density"), 7, 18, 1)}
      `,
      Navbar: `
        ${this.colorField(`${this.mode}_navbar`, __("Navbar"))}
        ${this.colorField(`${this.mode}_muted`, __("Muted Text"))}
        ${this.colorField(`${this.mode}_success`, __("Success"))}
      `,
      Components: NUMERIC_FIELDS.map(([field, label, min, max, step]) => this.rangeField(field, __(label), min, max, step)).join(""),
      Advanced: `<pre class="fts-code">${this.escape(this.cssPreview())}</pre>`,
    }[this.section];
    panel.html(html);
    panel.find("input").on("input", (event) => this.update(event.currentTarget.dataset.field, event.currentTarget.value));
    panel.find("[data-upload]").on("click", (event) => this.upload(event.currentTarget.dataset.upload));
    this.updateSegments();
  }

  renderVersions() {
    const versions = this.versions.filter((version) => version.theme === this.selected?.name);
    this.$(".fts-version-list").html(
      versions.length
        ? versions.map((version) => `<button class="btn btn-default btn-xs" data-version="${version.name}">${__("Restore")} ${version.version} · ${this.prettyDate(version.creation)}</button>`).join("")
        : `<p>${__("No published versions yet.")}</p>`,
    );
    this.$("[data-version]").on("click", (event) => this.restore(event.currentTarget.dataset.version));
  }

  renderPreview() {
    this.updateSegments();
    const d = this.draft;
    const css = this.previewVars();
    this.$(".fts-preview")
      .attr("data-device", this.device)
      .attr("style", css)
      .html(`
        <div class="fts-desk">
          <aside class="fts-desk-sidebar">
            <div class="fts-desk-logo">${this.escape(d.logo_text || "FT")}</div>
            ${["Accounting", "CRM", "Stock", "Projects", "HR", "Website"].map((item, index) => `<div class="fts-nav ${index === 1 ? "active" : ""}"><span></span>${__(item)}</div>`).join("")}
          </aside>
          <section class="fts-desk-main">
            <header class="fts-desk-top">
              <div><strong>${__("Selling Workspace")}</strong><span>${__(this.mode)} ${__("preview")}</span></div>
              <div><button>${__("New")}</button><button>${__("Import")}</button></div>
            </header>
            <div class="fts-desk-body">
              <div class="fts-kpis">
                ${this.kpi("Open Leads", "128", "+14")}
                ${this.kpi("Sales Orders", "$84.2k", "73% target")}
                ${this.kpi("Fulfillment", "91%", "healthy")}
              </div>
              <div class="fts-form-preview">
                <div><h3>${__("Customer")}</h3><button>${__("Save")}</button></div>
                <label>${__("Customer Name")}<input value="Atlas Manufacturing" readonly></label>
                <label>${__("Territory")}<input value="North America" readonly></label>
                <label>${__("Credit Limit")}<input value="$120,000" readonly></label>
              </div>
              <table>
                <thead><tr><th>${__("Invoice")}</th><th>${__("Status")}</th><th>${__("Total")}</th></tr></thead>
                <tbody>
                  <tr><td>INV-00421</td><td><span>${__("Paid")}</span></td><td>$12,800</td></tr>
                  <tr><td>INV-00422</td><td><span class="warn">${__("Draft")}</span></td><td>$7,450</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      `);
  }

  update(field, value) {
    this.history.unshift(this.clone(this.draft));
    this.future = [];
    this.draft[field] = ["font_weight", "button_radius", "card_radius", "density", "shadow"].includes(field) ? cint(value) : value;
    if (this.draft.is_built_in || this.draft.is_active) {
      this.draft.name = null;
      this.draft.theme_name = `${this.selected.theme_name} Draft`;
      this.draft.is_built_in = 0;
      this.draft.is_active = 0;
      this.draft.status = "Draft";
    }
    this.renderHeader();
    this.renderPreview();
  }

  async save() {
    const response = await frappe.call("frappe_theme_studio.api.save_theme", { payload: JSON.stringify(this.draft) });
    this.upsert(response.message);
    frappe.show_alert({ message: __("Draft saved"), indicator: "green" });
  }

  async publish() {
    if (!this.draft.name) await this.save();
    const response = await frappe.call("frappe_theme_studio.api.publish_theme", { theme: this.draft.name });
    await this.load();
    this.selected = this.themes.find((theme) => theme.name === response.message.name) || this.themes[0];
    this.draft = this.clone(this.selected);
    this.refreshThemeCss();
    frappe.show_alert({ message: __("Theme published"), indicator: "green" });
  }

  async deactivate() {
    if (!this.selected?.is_active) return;
    const response = await frappe.call("frappe_theme_studio.api.deactivate_theme", { theme: this.selected.name });
    this.upsert(response.message);
    this.refreshThemeCss();
    frappe.show_alert({ message: __("Theme deactivated"), indicator: "orange" });
  }

  async duplicate() {
    const response = await frappe.call("frappe_theme_studio.api.duplicate_theme", { theme: this.selected.name });
    this.upsert(response.message);
  }

  create() {
    this.selected = null;
    this.draft = {
      theme_name: __("Untitled Theme"),
      status: "Draft",
      mode: "System",
      font_family: "Aptos",
      font_weight: 500,
      button_radius: 6,
      card_radius: 8,
      density: 12,
      shadow: 18,
      logo_text: "FT",
      favicon_text: "F",
      ...this.defaultColors(),
    };
    this.render();
  }

  async delete() {
    if (!this.selected || this.selected.is_built_in || this.selected.is_active) return;
    await frappe.call("frappe_theme_studio.api.delete_theme", { theme: this.selected.name });
    await this.load();
  }

  async restore(version) {
    const response = await frappe.call("frappe_theme_studio.api.restore_version", { version });
    this.upsert(response.message);
    this.refreshThemeCss();
    frappe.show_alert({ message: __("Version restored"), indicator: "green" });
  }

  export() {
    const blob = new Blob([JSON.stringify(this.draft, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${this.scrub(this.draft.theme_name)}.theme.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  import(event) {
    const file = event.currentTarget.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const response = await frappe.call("frappe_theme_studio.api.import_theme", { payload: reader.result });
      this.upsert(response.message);
    };
    reader.readAsText(file);
  }

  undo() {
    const previous = this.history.shift();
    if (!previous) return;
    this.future.unshift(this.clone(this.draft));
    this.draft = previous;
    this.render();
  }

  redo() {
    const next = this.future.shift();
    if (!next) return;
    this.history.unshift(this.clone(this.draft));
    this.draft = next;
    this.render();
  }

  upsert(theme) {
    const index = this.themes.findIndex((item) => item.name === theme.name);
    if (index >= 0) this.themes.splice(index, 1, theme);
    else this.themes.unshift(theme);
    this.selected = theme;
    this.draft = this.clone(theme);
    this.render();
  }

  textField(field, label) {
    return `<label class="fts-field"><span>${label}</span><input data-field="${field}" value="${this.escape(this.draft[field] || "")}"></label>`;
  }

  fileField(field, label) {
    const value = this.draft[field];
    return `<div class="fts-field"><span>${label}</span><button class="btn btn-default btn-sm" data-upload="${field}">${value ? __("Replace File") : __("Upload File")}</button>${value ? `<small>${this.escape(value)}</small>` : ""}</div>`;
  }

  colorField(field, label) {
    return `<label class="fts-field fts-color"><span>${label}</span><input type="color" data-field="${field}" value="${this.draft[field] || "#000000"}"><code>${this.draft[field] || ""}</code></label>`;
  }

  rangeField(field, label, min, max, step) {
    const value = cint(this.draft[field]);
    return `<label class="fts-field"><span>${label}<b>${value}</b></span><input type="range" min="${min}" max="${max}" step="${step}" data-field="${field}" value="${value}"></label>`;
  }

  kpi(label, value, meta) {
    return `<article><small>${__(label)}</small><strong>${value}</strong><span>${__(meta)}</span></article>`;
  }

  previewVars() {
    const d = this.draft;
    const p = this.mode;
    return `
      --p-bg:${d[`${p}_background`]};--p-surface:${d[`${p}_surface`]};--p-panel:${d[`${p}_panel`]};
      --p-text:${d[`${p}_text`]};--p-muted:${d[`${p}_muted`]};--p-primary:${d[`${p}_primary`]};
      --p-accent:${d[`${p}_accent`]};--p-success:${d[`${p}_success`]};--p-border:${d[`${p}_border`]};
      --p-sidebar:${d[`${p}_sidebar`]};--p-sidebar-text:${d[`${p}_sidebar_text`]};--p-navbar:${d[`${p}_navbar`]};
      --p-button-radius:${cint(d.button_radius)}px;--p-card-radius:${cint(d.card_radius)}px;
      --p-density:${cint(d.density)}px;--p-shadow:0 ${Math.max(2, cint(d.shadow) / 2)}px ${cint(d.shadow)}px rgba(18,14,9,.16);
      --p-font:${d.font_family};--p-weight:${cint(d.font_weight)};
    `;
  }

  cssPreview() {
    return `:root {\n${this.previewVars().split(";").filter(Boolean).join(";\n")};\n}`;
  }

  updateSegments() {
    this.$("[data-device]").removeClass("active").filter(`[data-device="${this.device}"]`).addClass("active");
    this.$("[data-mode]").removeClass("active").filter(`[data-mode="${this.mode}"]`).addClass("active");
  }

  defaultColors() {
    return {
      light_background: "#f6f5ef",
      light_surface: "#ffffff",
      light_panel: "#ece7db",
      light_text: "#202020",
      light_muted: "#6b665c",
      light_primary: "#0d6b62",
      light_accent: "#d88a2d",
      light_success: "#2e8b57",
      light_border: "#d8d2c4",
      light_sidebar: "#1f2d2b",
      light_sidebar_text: "#f8f2e6",
      light_navbar: "#ffffff",
      dark_background: "#151716",
      dark_surface: "#202321",
      dark_panel: "#2b302d",
      dark_text: "#f3efe4",
      dark_muted: "#b7ac9a",
      dark_primary: "#65c2b5",
      dark_accent: "#e5a552",
      dark_success: "#6bc78d",
      dark_border: "#3d413d",
      dark_sidebar: "#101413",
      dark_sidebar_text: "#f3efe4",
      dark_navbar: "#202321",
    };
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  escape(value) {
    const text = String(value || "");
    if (frappe.utils && frappe.utils.escape_html) return frappe.utils.escape_html(text);
    return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  prettyDate(value) {
    if (!value) return "-";
    if (frappe.datetime && frappe.datetime.prettyDate) return frappe.datetime.prettyDate(value);
    return String(value).split(".")[0];
  }

  labelize(value) {
    return String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  scrub(value) {
    return String(value || "theme").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  upload(field) {
    new frappe.ui.FileUploader({
      folder: "Home/Attachments",
      allow_multiple: false,
      on_success: (file) => {
        this.update(field, file.file_url);
        this.renderControls();
      },
    });
  }

  refreshThemeCss() {
    const link = document.querySelector('link[href*="frappe_theme_studio.api.get_active_theme_css"]');
    if (link) link.href = link.href.split("?")[0] + "?v=" + Date.now();
  }
}
