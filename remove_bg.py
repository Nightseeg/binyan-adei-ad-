from rembg import remove
from PIL import Image
import traceback

input_path = "Binian Adei Ad.png"
output_path = "public/logo-transparent.png"

try:
    with open(input_path, 'rb') as i:
        with open(output_path, 'wb') as o:
            input = i.read()
            output = remove(input)
            o.write(output)
    print("Background removed successfully! Saved to", output_path)
except Exception as e:
    print("Error:", e)
    traceback.print_exc()
