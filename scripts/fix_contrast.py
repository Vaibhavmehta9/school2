import re
from pathlib import Path

portal_dir = Path("sheerwood-admission-portal/src")

replacements = [
    ("#718078", "#334155"),
    ("#4d9168", "#1b5e39"),
    ("#4f9169", "#1b5e39"),
    ("#61786a", "#294334"),
    ("#53695c", "#294334"),
    ("#63756a", "#294334"),
    ("#60766a", "#294334"),
    ("var(--color-charcoal-600)", "var(--color-charcoal-700)"),
]

css_files = list(portal_dir.rglob("*.css"))
print(f"Scanning {len(css_files)} CSS files...")

total_changes = 0
for css_file in css_files:
    content = css_file.read_text(encoding="utf-8")
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        css_file.write_text(content, encoding="utf-8")
        print(f"Updated {css_file.relative_to(portal_dir)}")
        total_changes += 1

print(f"Completed contrast updates across {total_changes} files.")

