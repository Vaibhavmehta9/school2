"""
Generate 1200x630 OpenGraph / Twitter social share image for Sherwood College.
Uses existing campus aerial photo (src/assets/sheerwood-campus-aerial-web.jpg)
and school crest (src/assets/sheerwood-crest.png).
Compressed under 300 KB.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    aerial_path = os.path.join(root, "src", "assets", "sheerwood-campus-aerial-web.jpg")
    crest_path = os.path.join(root, "src", "assets", "sheerwood-crest.png")
    output_path = os.path.join(root, "public", "og-image.jpg")

    target_w, target_h = 1200, 630

    # 1. Load and crop campus photo to 1200x630
    campus = Image.open(aerial_path).convert("RGBA")
    # Resize keeping aspect ratio to cover 1200x630
    orig_w, orig_h = campus.size
    ratio = max(target_w / orig_w, target_h / orig_h)
    new_w, new_h = int(orig_w * ratio), int(orig_h * ratio)
    campus_resized = campus.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Center crop
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    canvas = campus_resized.crop((left, top, left + target_w, top + target_h))

    # 2. Add rich heritage forest green gradient overlay (semi-transparent scrim)
    overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Gradient from dark green on left (#042a18 at 92% opacity) to softer green on right (#08783f at 65% opacity)
    for x in range(target_w):
        t = x / target_w
        # Opacity transitions from 235 (left) to 155 (right)
        alpha = int(235 - (t * 80))
        # Color shifts from deep forest (#032214) to brand green (#06482e)
        r = int(3 + t * 4)
        g = int(34 + t * 40)
        b = int(20 + t * 24)
        draw_overlay.line([(x, 0), (x, target_h)], fill=(r, g, b, alpha))

    # Composite canvas with overlay
    composed = Image.alpha_composite(canvas, overlay)

    # 3. Add school crest
    crest = Image.open(crest_path).convert("RGBA")
    crest_size = 140
    crest_resized = crest.resize((crest_size, crest_size), Image.Resampling.LANCZOS)

    crest_x = 75
    crest_y = 65
    composed.paste(crest_resized, (crest_x, crest_y), crest_resized)

    # 4. Draw Typography & Badges
    draw = ImageDraw.Draw(composed)

    # Use default PIL fonts or system TrueType fonts if available
    font_large = None
    font_sub = None
    font_badge = None
    font_cta = None

    # Try common system fonts
    font_candidates = [
        "C:\\Windows\\Fonts\\georgiab.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf"
    ]
    for fc in font_candidates:
        if os.path.exists(fc):
            try:
                font_large = ImageFont.truetype(fc, 58)
                font_sub = ImageFont.truetype(fc.replace("b.ttf", ".ttf"), 28)
                font_badge = ImageFont.truetype(fc, 20)
                font_cta = ImageFont.truetype(fc, 22)
                break
            except Exception:
                pass

    if font_large is None:
        font_large = font_sub = font_badge = font_cta = ImageFont.load_default()

    # Crest label alongside crest
    text_x = 75
    text_y = 235

    # Eyebrow / Heritage badge
    badge_text = "ESTD. 1869  ·  AYARPATTA HILL, NAINITAL  ·  ICSE / ISC"
    draw.text((text_x, text_y), badge_text, fill=(223, 184, 70), font=font_badge)

    # Main Title
    title_text = "SHERWOOD COLLEGE"
    draw.text((text_x, text_y + 36), title_text, fill=(255, 255, 255), font=font_large)

    # Subtitle / Admissions callout
    sub_text = "Admissions 2027-28 — India's Premier Heritage Boarding School"
    draw.text((text_x, text_y + 112), sub_text, fill=(240, 246, 242), font=font_sub)

    # Pill badge at bottom: Official Admissions Portal
    pill_x0 = text_x
    pill_y0 = text_y + 175
    pill_w = 460
    pill_h = 52
    draw.rounded_rectangle([pill_x0, pill_y0, pill_x0 + pill_w, pill_y0 + pill_h], radius=26, fill=(197, 155, 39))
    draw.text((pill_x0 + 28, pill_y0 + 12), "OFFICIAL ADMISSIONS PORTAL  ·  APPLY ONLINE", fill=(26, 21, 5), font=font_cta)

    # Gold decorative border around entire card (inset 16px)
    draw.rectangle([16, 16, target_w - 16, target_h - 16], outline=(197, 155, 39, 160), width=2)
    draw.rectangle([20, 20, target_w - 20, target_h - 20], outline=(223, 184, 70, 70), width=1)

    # Convert to RGB and save optimized JPEG
    final_rgb = composed.convert("RGB")
    final_rgb.save(output_path, "JPEG", quality=86, optimize=True)

    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"SUCCESS: Created {output_path} ({target_w}x{target_h}), size: {file_size_kb:.1f} KB")

if __name__ == "__main__":
    create_og_image()

