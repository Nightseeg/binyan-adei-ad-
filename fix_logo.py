from PIL import Image
img = Image.open('public/logo-transparent.png').convert('RGBA')
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
    img.save('public/logo-transparent.png', 'PNG')
print('Logo cropped to bounding box!')
