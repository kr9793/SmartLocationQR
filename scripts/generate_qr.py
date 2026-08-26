import json
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import HorizontalGradiantColorMask

BASE_URL = "https://kr9793.github.io/iSmartCompConnect/location.html?id="
LOCATIONS_FILE = "../assets/data/locations.json"
OUTPUT_FOLDER = "../QR_Codes"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

with open(LOCATIONS_FILE, "r", encoding="utf-8") as f:
    locations = json.load(f)

locations = sorted(locations, key=lambda loc: loc["id"])

def create_labeled_qr(data, text, filename, subtitle="Scan for venue map & schedule"):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Theme colors
    bg_color = "#05070d"  # Dark background
    text_color = "#f1f5f9" # Light text
    
    # Use gradient for QR code (Cyan to Purple)
    qr_img = qr.make_image(
        image_factory=StyledPilImage,
        color_mask=HorizontalGradiantColorMask(
            back_color=(5, 7, 13),      # #05070d
            left_color=(34, 211, 238),  # #22d3ee
            right_color=(168, 85, 247)  # #a855f7
        )
    ).convert('RGB')
    
    # Try to load appealing fonts (Segoe UI on Windows), fallback to Arial, then default
    try:
        font_main_title = ImageFont.truetype("segoeuib.ttf", 36) # Conference Title (Header)
        font_loc_name = ImageFont.truetype("segoeuib.ttf", 26)   # Location Name (Footer)
        font_sub = ImageFont.truetype("segoeui.ttf", 16)         # Instructions (Footer)
        font_tiny = ImageFont.truetype("segoeui.ttf", 10)        # Corner Watermarks
    except IOError:
        try:
            font_main_title = ImageFont.truetype("arialbd.ttf", 36)
            font_loc_name = ImageFont.truetype("arialbd.ttf", 26)
            font_sub = ImageFont.truetype("arial.ttf", 16)
            font_tiny = ImageFont.truetype("arial.ttf", 10)
        except IOError:
            font_main_title = ImageFont.load_default()
            font_loc_name = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            font_tiny = ImageFont.load_default()

    draw_temp = ImageDraw.Draw(Image.new('RGB', (1,1)))
    bbox_loc = draw_temp.textbbox((0, 0), text, font=font_loc_name)
    text_w_loc = bbox_loc[2] - bbox_loc[0]
    
    conf_title = "iSmartComp2026"
    bbox_conf = draw_temp.textbbox((0, 0), conf_title, font=font_main_title)
    text_w_conf = bbox_conf[2] - bbox_conf[0]
    
    logo_size = 38
    gap = 12
    total_w_header = logo_size + gap + text_w_conf

    # Calculate sizes
    qr_w, qr_h = qr_img.size
    header_h = 70  # Space for conference title at top
    footer_h = 75  # Space for location name and instructions at bottom
    
    # Require width to be at least max of QR, text, and header
    img_w = max(qr_w, text_w_loc + 60, total_w_header + 60)
    
    # Create new image with extra space at top and bottom, and dynamic width
    new_img = Image.new('RGB', (img_w, qr_h + header_h + footer_h), bg_color)
    
    qr_x = (img_w - qr_w) // 2
    new_img.paste(qr_img, (qr_x, header_h))
    
    draw = ImageDraw.Draw(new_img)
    
    # Draw Header (Logo + Conference Title)
    start_x = (img_w - total_w_header) // 2
    
    logo_path = "../assets/images/conference_logo.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        logo_y = (header_h - logo_size) // 2
        new_img.paste(logo, (start_x, logo_y), logo)
    else:
        # Fallback if logo not found, just center text
        start_x = (img_w - text_w_conf) // 2
        logo_size = 0
        gap = 0
        
    text_x_conf = start_x + logo_size + gap
    text_y_conf = (header_h - (bbox_conf[3] - bbox_conf[1])) // 2 - 5
    draw.text((text_x_conf, text_y_conf), conf_title, fill=text_color, font=font_main_title)

    # Draw Footer (Location Name)
    text_x_loc = (img_w - text_w_loc) // 2
    text_y_loc = header_h + qr_h + 5
    draw.text((text_x_loc, text_y_loc), text, fill=text_color, font=font_loc_name)
    
    # Draw Footer (Instructions)
    instruction_text = subtitle
    bbox_inst = draw.textbbox((0, 0), instruction_text, font=font_sub)
    text_x_inst = (img_w - (bbox_inst[2] - bbox_inst[0])) // 2
    text_y_inst = text_y_loc + 35
    draw.text((text_x_inst, text_y_inst), instruction_text, fill=text_color, font=font_sub)
    
    # Draw Tiny 'RK' in Corners
    corner_text = "RK"
    corner_color = "#334155" # Subtle slate color
    
    bbox_corner = draw.textbbox((0, 0), corner_text, font=font_tiny)
    corner_w = bbox_corner[2] - bbox_corner[0]
    corner_h = bbox_corner[3] - bbox_corner[1]
    
    pad = 4
    radius = max(corner_w, corner_h) // 2 + pad
    
    # Top Left
    tl_cx, tl_cy = 15, 15
    draw.ellipse([tl_cx - radius, tl_cy - radius, tl_cx + radius, tl_cy + radius], outline=corner_color, width=1)
    draw.text((tl_cx, tl_cy), corner_text, fill=corner_color, font=font_tiny, anchor="mm")
    
    # Bottom Right
    total_h = qr_h + header_h + footer_h
    br_cx, br_cy = img_w - 15, total_h - 15
    draw.ellipse([br_cx - radius, br_cy - radius, br_cx + radius, br_cy + radius], outline=corner_color, width=1)
    draw.text((br_cx, br_cy), corner_text, fill=corner_color, font=font_tiny, anchor="mm")
    
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    new_img.save(filepath)

for location in locations:
    location_id = location["id"]
    name = location.get("name", f"Location {location_id}")
    url = BASE_URL + str(location_id)
    
    safe_name = name.replace(' ', '_').replace('/', '_')
    filename = f"QR_{safe_name}.png"
    
    create_labeled_qr(url, name, filename)
    print(f"Created: {filename}")
    print(f"Name:    {name}")
    print(f"URL:     {url}\n")

print("================================")
print(f"All {len(locations)} location QR codes generated!")
print("================================")

# Generate Homepage QR code
home_url = "https://kr9793.github.io/iSmartCompConnect/"
create_labeled_qr(home_url, "iSmartComp Connect", "QR_Homepage.png", "Scan for schedule and venue details")
print(f"\nCreated: QR_Homepage.png")
print(f"URL:     {home_url}")