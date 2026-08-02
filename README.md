# Frappe Theme Studio

Frappe Theme Studio is a lightweight Frappe/ERPNext app for managing Desk themes from a visual editor.

## Features

- Frappe-native Desk page at `/app/theme-studio`
- Theme DocTypes with version history
- Built-in seed themes
- Draft, duplicate, import/export, and publish workflows
- Generated CSS served through `/api/method/frappe_theme_studio.api.get_active_theme_css`
- Desk boot integration that applies the active theme for all users
- No frontend build step or runtime JavaScript framework

## Install

```bash
bench get-app /path/to/frappe-theme-studio
bench --site your-site install-app frappe_theme_studio
bench --site your-site migrate
bench --site your-site clear-cache
```

Open `/app/theme-studio` as a System Manager.
