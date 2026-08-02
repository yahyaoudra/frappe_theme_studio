from frappe import _


def get_data():
    return [
        {
            "module_name": "Frappe Theme Studio",
            "category": "Administration",
            "label": _("Theme Studio"),
            "color": "teal",
            "icon": "octicon octicon-paintbrush",
            "type": "page",
            "link": "theme-studio",
        }
    ]
