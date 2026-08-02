app_name = "frappe_theme_studio"
app_title = "Frappe Theme Studio"
app_publisher = "Frappe Theme Studio"
app_description = "Lightweight visual theme customizer for Frappe Desk and ERPNext"
app_email = "admin@example.com"
app_license = "MIT"

required_apps = ["frappe"]

app_include_css = [
    "/api/method/frappe_theme_studio.api.get_active_theme_css",
]

doctype_js = {}
fixtures = []

after_install = "frappe_theme_studio.install.after_install"
after_migrate = "frappe_theme_studio.install.after_migrate"

has_permission = {
    "Frappe Theme": "frappe_theme_studio.api.has_theme_permission",
    "Frappe Theme Version": "frappe_theme_studio.api.has_theme_permission",
}
