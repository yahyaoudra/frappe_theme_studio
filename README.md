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

## Installation

These commands assume you are installing the app from this local directory:

```bash
/Users/yahya/Documents/ERPnext Theme Studio
```

Run the commands from your Frappe Bench directory, not from inside the app folder.

### 1. Add the app to your bench

Because the path contains spaces, wrap it in quotes:

```bash
bench get-app "/Users/yahya/Documents/ERPnext Theme Studio"
```

If you prefer installing from GitHub instead:

```bash
bench get-app https://github.com/yahyaoudra/frappe_theme_studio.git
```

The GitHub repository name matches the Frappe app/module name, so Bench should clone it into `apps/frappe_theme_studio` and build it as `frappe_theme_studio`.

### 2. Install on your site

Replace `your-site-name` with your actual site name:

```bash
bench --site your-site-name install-app frappe_theme_studio
```

### 3. Run migration and clear cache

```bash
bench --site your-site-name migrate
bench --site your-site-name clear-cache
bench build
bench restart
```

### 4. Open Theme Studio

Log in as a user with the **System Manager** role, then open:

```text
/app/theme-studio
```

For example:

```text
https://your-site-name/app/theme-studio
```

## Development Install

If you are working on the app locally and want Bench to use this exact folder, create a symlink from your bench `apps` directory:

```bash
cd /path/to/frappe-bench
ln -s "/Users/yahya/Documents/ERPnext Theme Studio" apps/frappe_theme_studio
bench --site your-site-name install-app frappe_theme_studio
bench --site your-site-name migrate
bench build
bench restart
```

## Updating After Changes

After pulling or editing the app:

```bash
bench --site your-site-name migrate
bench --site your-site-name clear-cache
bench build --app frappe_theme_studio
bench restart
```

## Troubleshooting

### `bench build --app frappe_theme_studio` fails with `paths[0]`

Make sure you are using the latest app source, then fetch and install normally:

```bash
cd /path/to/frappe-bench
bench get-app https://github.com/yahyaoudra/frappe_theme_studio.git
bench --site your-site-name install-app frappe_theme_studio
bench --site your-site-name migrate
bench build
```

If you already have a broken clone from a failed `bench get-app`, move it away first:

```bash
mv apps/frappe_theme_studio archived/apps/frappe_theme_studio-broken
```

This error can happen if Bench did not recognize the cloned folder as a Frappe app. Theme Studio includes the standard `hooks.py`, `modules.txt`, and `patches.txt` files that Bench uses for app detection.

## Uninstall

```bash
bench --site your-site-name uninstall-app frappe_theme_studio
bench --site your-site-name remove-from-installed-apps frappe_theme_studio
```
