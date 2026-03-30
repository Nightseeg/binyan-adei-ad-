from rembg import remove
from PIL import Image
import os

images = [
    "public/assets/images/flower-corner-top-left.png",
    "public/assets/images/flower-corner-bottom-right.png",
    "public/assets/images/flower-divider.png"
]

for img_path in images:
    if not os.path.exists(img_path):
        print(f"Skipping {img_path}, not found.")
        continue
    
    print(f"Processing {img_path}...")
    try:
        with open(img_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
            with open(img_path, 'wb') as o:
                o.write(output_data)
        print(f"Done: {img_path}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

print("All processing complete.")
