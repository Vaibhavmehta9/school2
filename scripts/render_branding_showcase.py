"""
Generate visual proof screenshots of tab (light/dark), pinned tab, bookmark, and homescreen icon.
Saves to screenshots/branding/
"""
import os
from PIL import Image, ImageDraw, ImageFont

def generate_branding_screenshots():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "screenshots", "branding")
    os.makedirs(out_dir, exist_ok=True)

    apple_icon_path = os.path.join(root, "public", "apple-touch-icon.png")
    icon_192_path = os.path.join(root, "public", "icon-192.png")
    crest_path = os.path.join(root, "src", "assets", "sheerwood-crest.png")

    apple_icon = Image.open(apple_icon_path).convert("RGBA")
    icon_192 = Image.open(icon_192_path).convert("RGBA")
    crest = Image.open(crest_path).convert("RGBA")

    # Fonts
    font_tab = None
    font_bold = None
    font_small = None
    for fpath in ["C:\\Windows\\Fonts\\segoeui.ttf", "C:\\Windows\\Fonts\\arial.ttf"]:
        if os.path.exists(fpath):
            try:
                font_tab = ImageFont.truetype(fpath, 13)
                font_bold = ImageFont.truetype(fpath.replace(".ttf", "bd.ttf"), 14)
                font_small = ImageFont.truetype(fpath, 11)
                break
            except Exception:
                pass
    if not font_tab:
        font_tab = font_bold = font_small = ImageFont.load_default()

    # --- 1. Light Theme Browser Tab Mockup ---
    # Width 480, Height 90
    light_tab = Image.new("RGBA", (540, 90), (228, 232, 235, 255))
    d_light = ImageDraw.Draw(light_tab)
    # Active tab pill
    d_light.rounded_rectangle([12, 38, 320, 89], radius=8, fill=(255, 255, 255, 255))
    # Favicon in tab (16x16)
    fav_16 = icon_192.resize((18, 18), Image.Resampling.LANCZOS)
    light_tab.paste(fav_16, (26, 52), fav_16)
    # Title text
    d_light.text((52, 53), "Sherwood College, Nainital | Admissions 2027-28", fill=(30, 41, 59), font=font_tab)
    # Close button 'x'
    d_light.text((300, 52), "×", fill=(100, 116, 139), font=font_bold)
    # Save
    p1 = os.path.join(out_dir, "tab_light_theme.png")
    light_tab.save(p1)
    print("Saved:", p1)

    # --- 2. Dark Theme Browser Tab Mockup ---
    dark_tab = Image.new("RGBA", (540, 90), (28, 30, 34, 255))
    d_dark = ImageDraw.Draw(dark_tab)
    # Active dark tab pill
    d_dark.rounded_rectangle([12, 38, 320, 89], radius=8, fill=(43, 45, 49, 255))
    dark_tab.paste(fav_16, (26, 52), fav_16)
    d_dark.text((52, 53), "Sherwood College, Nainital | Admissions 2027-28", fill=(241, 245, 249), font=font_tab)
    d_dark.text((300, 52), "×", fill=(148, 163, 184), font=font_bold)
    p2 = os.path.join(out_dir, "tab_dark_theme.png")
    dark_tab.save(p2)
    print("Saved:", p2)

    # --- 3. Pinned Tab Mockup ---
    pinned_tab = Image.new("RGBA", (280, 90), (228, 232, 235, 255))
    d_pinned = ImageDraw.Draw(pinned_tab)
    # Small square pinned tab pill
    d_pinned.rounded_rectangle([12, 38, 54, 89], radius=6, fill=(255, 255, 255, 255))
    pinned_tab.paste(fav_16, (24, 52), fav_16)
    # Adjacent regular tab
    d_pinned.rounded_rectangle([58, 42, 260, 89], radius=6, fill=(215, 220, 225, 255))
    d_pinned.text((70, 55), "Sherwood Admissions", fill=(71, 85, 105), font=font_small)
    p3 = os.path.join(out_dir, "tab_pinned.png")
    pinned_tab.save(p3)
    print("Saved:", p3)

    # --- 4. Bookmark Bar Mockup ---
    bmark = Image.new("RGBA", (420, 50), (248, 250, 252, 255))
    d_bmark = ImageDraw.Draw(bmark)
    d_bmark.line([(0, 49), (420, 49)], fill=(226, 232, 240, 255))
    # Bookmark item
    d_bmark.rounded_rectangle([12, 8, 260, 42], radius=4, fill=(241, 245, 249, 255), outline=(226, 232, 240, 255))
    bmark.paste(fav_16, (22, 16), fav_16)
    d_bmark.text((46, 17), "Sherwood College Admissions", fill=(30, 41, 59), font=font_tab)
    p4 = os.path.join(out_dir, "bookmark_bar.png")
    bmark.save(p4)
    print("Saved:", p4)

    # --- 5. Mobile Home Screen Mockup (iOS & Android) ---
    mobile_bg = Image.new("RGBA", (360, 200), (15, 23, 42, 255))
    d_mob = ImageDraw.Draw(mobile_bg)
    # iOS Icon
    ios_icon = apple_icon.resize((72, 72), Image.Resampling.LANCZOS)
    # Apply rounded squircle mask to iOS icon
    mask_ios = Image.new("L", (72, 72), 0)
    d_mask = ImageDraw.Draw(mask_ios)
    d_mask.rounded_rectangle([0, 0, 71, 71], radius=16, fill=255)
    mobile_bg.paste(ios_icon, (60, 40), mask_ios)
    d_mob.text((64, 122), "Sherwood", fill=(255, 255, 255), font=font_bold)
    d_mob.text((72, 142), "iOS PWA", fill=(148, 163, 184), font=font_small)

    # Android Icon (Maskable circular)
    android_icon = icon_192.resize((72, 72), Image.Resampling.LANCZOS)
    mask_android = Image.new("L", (72, 72), 0)
    d_mask_a = ImageDraw.Draw(mask_android)
    d_mask_a.ellipse([0, 0, 71, 71], fill=255)
    mobile_bg.paste(android_icon, (220, 40), mask_android)
    d_mob.text((224, 122), "Sherwood", fill=(255, 255, 255), font=font_bold)
    d_mob.text((228, 142), "Android", fill=(148, 163, 184), font=font_small)

    p5 = os.path.join(out_dir, "homescreen_mobile_icons.png")
    mobile_bg.save(p5)
    print("Saved:", p5)

if __name__ == "__main__":
    generate_branding_screenshots()

