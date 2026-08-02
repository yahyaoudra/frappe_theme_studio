import frappe


LIGHT = {
    "background": "#f6f5ef",
    "surface": "#ffffff",
    "panel": "#ece7db",
    "text": "#202020",
    "muted": "#6b665c",
    "primary": "#0d6b62",
    "accent": "#d88a2d",
    "success": "#2e8b57",
    "border": "#d8d2c4",
    "sidebar": "#1f2d2b",
    "sidebar_text": "#f8f2e6",
    "navbar": "#ffffff",
}

DARK = {
    "background": "#151716",
    "surface": "#202321",
    "panel": "#2b302d",
    "text": "#f3efe4",
    "muted": "#b7ac9a",
    "primary": "#65c2b5",
    "accent": "#e5a552",
    "success": "#6bc78d",
    "border": "#3d413d",
    "sidebar": "#101413",
    "sidebar_text": "#f3efe4",
    "navbar": "#202321",
}


DEFAULT_THEMES = [
    ("Frappe Classic", "Aptos", LIGHT, DARK, 1),
    ("ERPNext Blue", "Aptos", {**LIGHT, "primary": "#2563a8", "accent": "#0f8b8d", "sidebar": "#172b4d"}, {**DARK, "primary": "#7ab7ff"}, 0),
    ("Modern Light", "IBM Plex Sans", {**LIGHT, "background": "#f8f7f2", "primary": "#185b52"}, DARK, 0),
    ("Modern Dark", "IBM Plex Sans", LIGHT, {**DARK, "background": "#101312", "surface": "#1b1f1d"}, 0),
    ("Minimal", "ui-sans-serif", {**LIGHT, "background": "#fafafa", "primary": "#222222", "accent": "#78716c", "sidebar": "#262626"}, DARK, 0),
    ("High Contrast", "Atkinson Hyperlegible", {**LIGHT, "background": "#ffffff", "text": "#000000", "primary": "#005fcc", "accent": "#ffb000"}, {**DARK, "background": "#000000", "surface": "#111111", "text": "#ffffff"}, 0),
    ("Soft Gray", "Aptos", {**LIGHT, "background": "#f2f2ef", "primary": "#4f6f64", "accent": "#997a4d"}, DARK, 0),
    ("Corporate", "IBM Plex Sans", {**LIGHT, "primary": "#224f7a", "accent": "#a46b31", "sidebar": "#17283a"}, {**DARK, "primary": "#78a9d6"}, 0),
    ("Compact", "Aptos", {**LIGHT, "primary": "#345c54"}, DARK, 0),
    ("Colorful", "Aptos", {**LIGHT, "primary": "#0f766e", "accent": "#c2410c", "success": "#15803d"}, {**DARK, "primary": "#5eead4", "accent": "#fb923c"}, 0),
]


def ensure_seed_themes():
    if not frappe.db.exists("Module Def", "Frappe Theme Studio"):
        frappe.get_doc({"doctype": "Module Def", "module_name": "Frappe Theme Studio", "app_name": "frappe_theme_studio"}).insert(ignore_permissions=True)

    for name, font, light, dark, active in DEFAULT_THEMES:
        if frappe.db.exists("Frappe Theme", name):
            continue
        doc = frappe.get_doc(
            {
                "doctype": "Frappe Theme",
                "theme_name": name,
                "is_built_in": 1,
                "is_active": active,
                "status": "Published" if active else "Built In",
                "mode": "System",
                "font_family": font,
                "font_weight": 500,
                "button_radius": 6,
                "card_radius": 8,
                "density": 12,
                "shadow": 18,
                "logo_text": "".join(part[0] for part in name.split()[:2]).upper(),
                "favicon_text": name[0].upper(),
                **{f"light_{key}": value for key, value in light.items()},
                **{f"dark_{key}": value for key, value in dark.items()},
            }
        )
        doc.insert(ignore_permissions=True)
