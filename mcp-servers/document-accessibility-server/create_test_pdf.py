from PIL import Image, ImageDraw, ImageFont
import os

def create_inaccessible_pdf():
    """Create an inaccessible PDF (image-only, untagged)."""
    # Create an image with text (simulating scanned doc)
    img = Image.new('RGB', (600, 800), color = (255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Add some text to the image
    d.text((10,10), "This is an inaccessible PDF", fill=(0,0,0))
    d.text((10,30), "It is just an image.", fill=(0,0,0))
    
    # Save as PDF
    img.save('test_bad.pdf')
    print("Created test_bad.pdf")

if __name__ == "__main__":
    create_inaccessible_pdf()
