"""
Generate favicon and PWA icons for Sherwood College from master crest.
Outputs:
- public/favicon.svg
- public/favicon.ico
- public/apple-touch-icon.png (180x180, solid brand dark green)
- public/icon-192.png
- public/icon-512.png
- public/icon-512-maskable.png (with 20% safe zone padding)
"""
import os
from PIL import Image

def generate_icons():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_crest = os.path.join(root, "src", "assets", "sheerwood-crest.png")
    public_dir = os.path.join(root, "public")

    os.makedirs(public_dir, exist_ok=True)
    crest = Image.open(src_crest).convert("RGBA")

    # Brand Colors
    brand_green = (8, 120, 63, 255)       # #08783f
    brand_dark_green = (5, 75, 45, 255)   # #054b2d
    brand_gold = (197, 155, 39, 255)      # #c59b27

    # 1. apple-touch-icon.png (180x180, solid background, NO transparency)
    apple_size = 180
    apple_img = Image.new("RGBA", (apple_size, apple_size), brand_dark_green)
    crest_scaled_apple = crest.resize((150, 150), Image.Resampling.LANCZOS)
    apple_img.paste(crest_scaled_apple, (15, 15), crest_scaled_apple)
    apple_rgb = apple_img.convert("RGB")
    apple_rgb.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")
    print("Created apple-touch-icon.png (180x180)")

    # 2. icon-192.png (192x192)
    pwa_192 = Image.new("RGBA", (192, 192), brand_dark_green)
    crest_160 = crest.resize((160, 160), Image.Resampling.LANCZOS)
    pwa_192.paste(crest_160, (16, 16), crest_160)
    pwa_192.save(os.path.join(public_dir, "icon-192.png"), "PNG")
    print("Created icon-192.png (192x192)")

    # 3. icon-512.png (512x512)
    pwa_512 = Image.new("RGBA", (512, 512), brand_dark_green)
    crest_440 = crest.resize((440, 440), Image.Resampling.LANCZOS)
    pwa_512.paste(crest_440, (36, 36), crest_440)
    pwa_512.save(os.path.join(public_dir, "icon-512.png"), "PNG")
    print("Created icon-512.png (512x512)")

    # 4. icon-512-maskable.png (512x512, with safe margin for squircle/circle cropping)
    # The safe zone is the center 80% circle (diameter 409px). Inner crest sized at 360x360.
    maskable_512 = Image.new("RGBA", (512, 512), brand_dark_green)
    crest_360 = crest.resize((360, 360), Image.Resampling.LANCZOS)
    maskable_512.paste(crest_360, (76, 76), crest_360)
    maskable_512.save(os.path.join(public_dir, "icon-512-maskable.png"), "PNG")
    print("Created icon-512-maskable.png (512x512)")

    # 5. favicon.ico (multi-res 16x16, 32x32, 48x48)
    ico_img = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    crest_48 = crest.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.paste(crest_48, (0, 0), crest_48)
    ico_img.save(
        os.path.join(public_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("Created favicon.ico (16x16, 32x32, 48x48)")

if __name__ == "__main__":
    generate_icons()

