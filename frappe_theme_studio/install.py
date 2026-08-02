import frappe

from frappe_theme_studio.seed import ensure_seed_themes


def after_install():
    ensure_seed_themes()
    frappe.clear_cache()


def after_migrate():
    ensure_seed_themes()
    frappe.clear_cache()
