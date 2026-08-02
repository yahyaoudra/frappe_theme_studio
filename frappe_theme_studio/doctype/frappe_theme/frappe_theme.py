import frappe
from frappe.model.document import Document


class FrappeTheme(Document):
    def validate(self):
        if self.is_active:
            frappe.db.sql("update `tabFrappe Theme` set is_active = 0 where name != %s", self.name)

    def autoname(self):
        self.name = self.theme_name
