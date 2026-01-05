"""
PDF-specific accessibility tools.
"""

from typing import Dict, Any, List
import pypdf
import fitz
import pdfplumber


def extract_pdf_structure(file_path: str) -> Dict[str, Any]:
    """Extract PDF structure information."""
    try:
        doc = fitz.open(file_path)
        toc = doc.get_toc()
        
        structure = {
            "pages": doc.page_count,
            "bookmarks": len(toc),
            "outline": [{"level": level, "title": title, "page": page} for level, title, page in toc],
        }
        
        doc.close()
        return structure
    
    except Exception as e:
        return {"error": str(e)}


def check_pdf_tags(file_path: str) -> Dict[str, Any]:
    """Check PDF tagging status."""
    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            
            has_structure = False
            if reader.trailer.get("/Root"):
                root = reader.trailer["/Root"]
                if isinstance(root, pypdf.generic.DictionaryObject):
                    has_structure = "/StructTreeRoot" in root
            
            return {
                "tagged": has_structure,
                "message": "PDF is tagged" if has_structure else "PDF is not tagged (required for PDF/UA compliance)"
            }
    
    except Exception as e:
        return {"error": str(e)}


def check_pdf_alt_text(file_path: str) -> Dict[str, Any]:
    """Check for images and their alt text."""
    try:
        doc = fitz.open(file_path)
        images_info = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            images = page.get_images()
            
            for img_index, img in enumerate(images):
                images_info.append({
                    "page": page_num + 1,
                    "index": img_index + 1,
                    "needs_verification": True,
                })
        
        doc.close()
        
        return {
            "total_images": len(images_info),
            "images": images_info,
            "message": f"Found {len(images_info)} images - verify all have alt text"
        }
    
    except Exception as e:
        return {"error": str(e)}


def check_pdf_reading_order(file_path: str) -> Dict[str, Any]:
    """Check reading order."""
    try:
        with pdfplumber.open(file_path) as pdf:
            reading_order = []
            
            for page_num, page in enumerate(pdf.pages):
                words = page.extract_words()
                reading_order.append({
                    "page": page_num + 1,
                    "word_count": len(words),
                    "needs_manual_verification": True,
                })
            
            return {
                "pages": len(reading_order),
                "message": "Reading order should be manually verified with assistive technology",
                "pages_info": reading_order,
            }
    
    except Exception as e:
        return {"error": str(e)}


def check_pdf_contrast(file_path: str, wcag_level: str = "AA") -> Dict[str, Any]:
    """Basic color contrast check."""
    return {
        "wcag_level": wcag_level,
        "message": "Color contrast should be manually verified using PAC or Adobe Acrobat accessibility checker",
        "recommended_tools": [
            "PDF Accessibility Checker (PAC)",
            "Adobe Acrobat Pro Accessibility Checker",
            "Colour Contrast Analyser",
        ],
    }
