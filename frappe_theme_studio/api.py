import json
import re

import frappe
from frappe import _


HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
NUMERIC_FIELDS = {"font_weight", "button_radius", "card_radius", "density", "shadow"}


def has_theme_permission(doc=None, ptype=None, user=None):
    return "System Manager" in frappe.get_roles(user)


def _require_manager():
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Managers can manage themes."), frappe.PermissionError)


def _theme_fields():
    return [
        "name",
        "theme_name",
        "status",
        "is_built_in",
        "is_active",
        "mode",
        "font_family",
        "font_weight",
        "logo",
        "button_radius",
        "card_radius",
        "density",
        "shadow",
        "logo_text",
        "favicon",
        "favicon_text",
        "modified",
        "owner",
        "light_background",
        "light_surface",
        "light_panel",
        "light_text",
        "light_muted",
        "light_primary",
        "light_accent",
        "light_success",
        "light_border",
        "light_sidebar",
        "light_sidebar_text",
        "light_navbar",
        "dark_background",
        "dark_surface",
        "dark_panel",
        "dark_text",
        "dark_muted",
        "dark_primary",
        "dark_accent",
        "dark_success",
        "dark_border",
        "dark_sidebar",
        "dark_sidebar_text",
        "dark_navbar",
    ]


@frappe.whitelist()
def get_studio_state():
    _require_manager()
    themes = frappe.get_all("Frappe Theme", fields=_theme_fields(), order_by="is_active desc, modified desc")
    versions = frappe.get_all(
        "Frappe Theme Version",
        fields=["name", "theme", "version", "creation", "owner"],
        order_by="creation desc",
        limit_page_length=50,
    )
    return {"themes": themes, "versions": versions}


@frappe.whitelist()
def save_theme(payload):
    _require_manager()
    data = json.loads(payload) if isinstance(payload, str) else payload
    name = data.get("name")
    if name and frappe.db.exists("Frappe Theme", name):
        doc = frappe.get_doc("Frappe Theme", name)
        if doc.is_built_in:
            frappe.throw(_("Duplicate built-in themes before editing them."))
    else:
        doc = frappe.new_doc("Frappe Theme")

    _apply_theme_data(doc, data)
    doc.status = "Draft"
    doc.is_active = 0
    doc.save()
    return doc.as_dict()


@frappe.whitelist()
def duplicate_theme(theme):
    _require_manager()
    source = frappe.get_doc("Frappe Theme", theme)
    doc = frappe.copy_doc(source)
    doc.theme_name = f"{source.theme_name} Copy"
    doc.is_built_in = 0
    doc.is_active = 0
    doc.status = "Draft"
    doc.insert()
    return doc.as_dict()


@frappe.whitelist()
def publish_theme(theme):
    _require_manager()
    doc = frappe.get_doc("Frappe Theme", theme)
    frappe.db.sql("update `tabFrappe Theme` set is_active = 0 where name != %s", doc.name)
    doc.is_active = 1
    doc.status = "Published"
    doc.save()
    _create_version(doc)
    frappe.clear_cache()
    return doc.as_dict()


@frappe.whitelist()
def deactivate_theme(theme):
    _require_manager()
    doc = frappe.get_doc("Frappe Theme", theme)
    doc.is_active = 0
    doc.status = "Draft" if not doc.is_built_in else "Built In"
    doc.save()
    frappe.clear_cache()
    return doc.as_dict()


@frappe.whitelist()
def restore_version(version):
    _require_manager()
    version_doc = frappe.get_doc("Frappe Theme Version", version)
    snapshot = json.loads(version_doc.snapshot)
    doc = frappe.get_doc("Frappe Theme", version_doc.theme)
    was_active = doc.is_active
    for field in _theme_fields():
        if field in {"name", "modified", "owner", "is_built_in", "is_active"}:
            continue
        if field in snapshot:
            doc.set(field, snapshot[field])
    doc.status = "Draft"
    doc.is_active = 0
    doc.save()
    if was_active:
        publish_theme(doc.name)
    return doc.as_dict()


@frappe.whitelist()
def delete_theme(theme):
    _require_manager()
    doc = frappe.get_doc("Frappe Theme", theme)
    if doc.is_built_in:
        frappe.throw(_("Built-in themes cannot be deleted."))
    if doc.is_active:
        frappe.throw(_("Active themes cannot be deleted."))
    frappe.delete_doc("Frappe Theme", doc.name)
    return {"ok": True}


@frappe.whitelist()
def import_theme(payload):
    _require_manager()
    data = json.loads(payload) if isinstance(payload, str) else payload
    doc = frappe.new_doc("Frappe Theme")
    _apply_theme_data(doc, data)
    doc.theme_name = f"{doc.theme_name or 'Imported Theme'}"
    doc.is_built_in = 0
    doc.is_active = 0
    doc.status = "Draft"
    doc.insert()
    return doc.as_dict()


@frappe.whitelist(allow_guest=True)
def get_active_theme_css():
    frappe.local.response.type = "css"
    theme_name = frappe.db.get_value("Frappe Theme", {"is_active": 1}, "name")
    if not theme_name:
        return ""
    doc = frappe.get_doc("Frappe Theme", theme_name)
    return build_css(doc)


def _apply_theme_data(doc, data):
    for field in _theme_fields():
        if field in {"name", "modified", "owner", "is_built_in", "is_active"}:
            continue
        if field in data:
            value = data[field]
            if field in NUMERIC_FIELDS:
                value = int(value or 0)
            if field.startswith(("light_", "dark_")) and value and not HEX_RE.match(str(value)):
                frappe.throw(_("Invalid color value for {0}").format(field))
            doc.set(field, value)


def _create_version(doc):
    latest = frappe.db.count("Frappe Theme Version", {"theme": doc.name}) + 1
    frappe.get_doc(
        {
            "doctype": "Frappe Theme Version",
            "theme": doc.name,
            "version": str(latest),
            "snapshot": json.dumps(doc.as_dict(), default=str, indent=2),
        }
    ).insert(ignore_permissions=True)


def build_css(doc):
    light = _variant(doc, "light")
    dark = _variant(doc, "dark")
    selected = dark if doc.mode == "Dark" else light
    base = _css_vars(selected, doc)
    dark_css = _css_vars(dark, doc)
    system_dark = "" if doc.mode in {"Light", "Dark"} else f"""
html[data-theme="dark"], body.theme-studio-dark {{
{dark_css}
}}
"""
    return f"""
:root {{
{base}
}}
{system_dark}
.layout-side-section, .desk-sidebar, .standard-sidebar {{
  background: var(--fts-sidebar) !important;
  color: var(--fts-sidebar-text) !important;
}}
.navbar, .navbar-default {{
  background: var(--fts-navbar) !important;
  border-bottom-color: var(--fts-border) !important;
}}
.page-container, .layout-main-section {{
  background: var(--fts-bg);
  color: var(--fts-text);
}}
.widget, .dashboard-widget-box, .form-dashboard, .frappe-card, .page-form {{
  background: var(--fts-surface) !important;
  border-color: var(--fts-border) !important;
  border-radius: var(--fts-card-radius) !important;
  box-shadow: var(--fts-shadow) !important;
}}
.btn-primary, .primary-action {{
  background: var(--fts-primary) !important;
  border-color: var(--fts-primary) !important;
  border-radius: var(--fts-button-radius) !important;
}}
.btn, .input-with-feedback, .form-control, .awesomplete input {{
  border-radius: var(--fts-button-radius) !important;
}}
body {{
  font-family: var(--fts-font-family), var(--font-stack, sans-serif);
  font-weight: var(--fts-font-weight);
}}
"""


def _variant(doc, prefix):
    return {
        "background": doc.get(f"{prefix}_background"),
        "surface": doc.get(f"{prefix}_surface"),
        "panel": doc.get(f"{prefix}_panel"),
        "text": doc.get(f"{prefix}_text"),
        "muted": doc.get(f"{prefix}_muted"),
        "primary": doc.get(f"{prefix}_primary"),
        "accent": doc.get(f"{prefix}_accent"),
        "success": doc.get(f"{prefix}_success"),
        "border": doc.get(f"{prefix}_border"),
        "sidebar": doc.get(f"{prefix}_sidebar"),
        "sidebar_text": doc.get(f"{prefix}_sidebar_text"),
        "navbar": doc.get(f"{prefix}_navbar"),
    }


def _css_vars(colors, doc):
    rows = [f"  --fts-{key.replace('_', '-')}: {value};" for key, value in colors.items() if value]
    rows.extend(
        [
            f"  --fts-font-family: {doc.font_family or 'Aptos'};",
            f"  --fts-font-weight: {int(doc.font_weight or 500)};",
            f"  --fts-button-radius: {int(doc.button_radius or 6)}px;",
            f"  --fts-card-radius: {int(doc.card_radius or 8)}px;",
            f"  --fts-density: {int(doc.density or 12)}px;",
            f"  --fts-shadow: 0 {max(2, int(doc.shadow or 18) // 2)}px {int(doc.shadow or 18)}px rgba(18, 14, 9, .16);",
        ]
    )
    return "\n".join(rows)
