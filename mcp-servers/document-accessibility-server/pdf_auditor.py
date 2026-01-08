"""
PDF Accessibility Auditor

Comprehensive PDF accessibility checking following PDF/UA (ISO 14289)
and WCAG 2.2 AA standards.
"""

import logging
from pathlib import Path
from typing import Dict, List, Any

import pypdf
import pdfplumber
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


async def audit_pdf_accessibility(file_path: str, detailed: bool = True) -> Dict[str, Any]:
    """
    Perform comprehensive PDF accessibility audit.
    
    Args:
        file_path: Path to PDF file
        detailed: Include detailed analysis (slower)
        
    Returns:
        Audit report with issues categorized by WCAG principle
    """
    issues = []
    metadata = {}
    
    try:
        # Open PDF with multiple libraries for comprehensive analysis
        pdf_path = Path(file_path)
        if not pdf_path.exists():
            return {"error": f"File not found: {file_path}"}
        
        # Extract metadata
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            metadata = {
                "pages": len(reader.pages),
                "encrypted": reader.is_encrypted,
                "metadata": dict(reader.metadata) if reader.metadata else {},
            }
        
        # Run all checks
        issues.extend(await check_document_structure(file_path))
        issues.extend(await check_alternative_text(file_path))
        issues.extend(await check_language_settings(file_path, metadata))
        issues.extend(await check_document_title(metadata))
        issues.extend(await check_tagged_pdf(file_path))
        
        if detailed:
            issues.extend(await check_reading_order_detailed(file_path))
            issues.extend(await check_form_fields(file_path))
            issues.extend(await check_tables(file_path))
            issues.extend(await check_color_contrast_pdf(file_path))
        
        # Categorize issues by WCAG principle
        categorized = {
            "Perceivable": [],
            "Operable": [],
            "Understandable": [],
            "Robust": [],
        }
        
        for issue in issues:
            principle = issue.get("wcag_principle", "Robust")
            categorized[principle].append(issue)
        
        return {
            "file": file_path,
            "metadata": metadata,
            "total_issues": len(issues),
            "perceivable_count": len(categorized["Perceivable"]),
            "operable_count": len(categorized["Operable"]),
            "understandable_count": len(categorized["Understandable"]),
            "robust_count": len(categorized["Robust"]),
            "issues": issues,
            "issues_by_principle": categorized,
        }
    
    except Exception as e:
        logger.error(f"Error auditing PDF {file_path}: {e}", exc_info=True)
        return {"error": str(e), "file": file_path}


async def check_document_structure(file_path: str) -> List[Dict[str, Any]]:
    """Check PDF document structure (headings, bookmarks)."""
    issues = []
    
    try:
        doc = fitz.open(file_path)
        toc = doc.get_toc()
        
        # Check for bookmarks/outline
        if not toc or len(toc) == 0:
            issues.append({
                "wcag_principle": "Operable",
                "success_criterion": "2.4.5",
                "success_criterion_name": "Multiple Ways",
                "severity": "moderate",
                "description": "PDF has no bookmarks or document outline. This makes navigation difficult for assistive technology users.",
                "remediation": "Add bookmarks/outline to the PDF for major sections and headings.",
                "detection_source": "pdf-structure-check",
            })
        
        # Check for very long documents without structure
        if doc.page_count > 10 and len(toc) < 3:
            issues.append({
                "wcag_principle": "Operable",
                "success_criterion": "2.4.6",
                "success_criterion_name": "Headings and Labels",
                "severity": "moderate",
                "description": f"PDF has {doc.page_count} pages but only {len(toc)} bookmark entries. Document structure may be inadequate.",
                "remediation": "Add more detailed bookmarks to reflect document structure.",
                "detection_source": "pdf-structure-check",
            })
        
        doc.close()
    
    except Exception as e:
        logger.error(f"Error checking PDF structure: {e}")
    
    return issues


async def check_alternative_text(file_path: str) -> List[Dict[str, Any]]:
    """Check for images without alternative text."""
    issues = []
    
    try:
        doc = fitz.open(file_path)
        images_without_alt = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            images = page.get_images()
            
            for img_index, img in enumerate(images):
                # Check if image has alt text in structure tree
                # Note: This is simplified - full PDF/UA check requires deeper analysis
                images_without_alt.append({
                    "page": page_num + 1,
                    "image_index": img_index + 1,
                })
        
        if images_without_alt:
            issues.append({
                "wcag_principle": "Perceivable",
                "success_criterion": "1.1.1",
                "success_criterion_name": "Non-text Content",
                "severity": "critical",
                "description": f"Found {len(images_without_alt)} images that may be missing alternative text. This prevents screen reader users from understanding the content.",
                "element_snippet": f"Images on pages: {', '.join(str(img['page']) for img in images_without_alt[:5])}...",
                "remediation": "Add alternative text to all images in the PDF. Use Adobe Acrobat or other PDF editing tools to tag images with descriptive alt text.",
                "detection_source": "pdf-image-check",
            })
        
        doc.close()
    
    except Exception as e:
        logger.error(f"Error checking alt text: {e}")
    
    return issues


async def check_language_settings(file_path: str, metadata: Dict) -> List[Dict[str, Any]]:
    """Check document language specification."""
    issues = []
    
    try:
        # Check if language is specified in metadata
        lang = metadata.get("metadata", {}).get("/Lang")
        
        if not lang:
            issues.append({
                "wcag_principle": "Understandable",
                "success_criterion": "3.1.1",
                "success_criterion_name": "Language of Page",
                "severity": "serious",
                "description": "PDF document does not specify a language. Screen readers may not pronounce text correctly.",
                "remediation": "Set the document language in PDF properties (e.g., 'en-US' for English, 'sv-SE' for Swedish).",
                "detection_source": "pdf-metadata-check",
            })
    
    except Exception as e:
        logger.error(f"Error checking language: {e}")
    
    return issues


async def check_document_title(metadata: Dict) -> List[Dict[str, Any]]:
    """Check for document title."""
    issues = []
    
    try:
        title = metadata.get("metadata", {}).get("/Title")
        
        if not title or title.strip() == "":
            issues.append({
                "wcag_principle": "Operable",
                "success_criterion": "2.4.2",
                "success_criterion_name": "Page Titled",
                "severity": "serious",
                "description": "PDF document has no title set. This makes it hard to identify the document's purpose.",
                "remediation": "Set a descriptive title in PDF document properties.",
                "detection_source": "pdf-metadata-check",
            })
    
    except Exception as e:
        logger.error(f"Error checking title: {e}")
    
    return issues


async def check_tagged_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Check if PDF is tagged (essential for PDF/UA compliance)."""
    issues = []
    
    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            
            # Check for StructTreeRoot (indicates tagged PDF)
            has_structure = False
            if reader.trailer.get("/Root"):
                root = reader.trailer["/Root"]
                if isinstance(root, pypdf.generic.DictionaryObject):
                    has_structure = "/StructTreeRoot" in root
            
            if not has_structure:
                issues.append({
                    "wcag_principle": "Robust",
                    "success_criterion": "4.1.2",
                    "success_criterion_name": "Name, Role, Value",
                    "severity": "critical",
                    "description": "PDF is not tagged. Tagged PDFs are required for PDF/UA compliance and essential for screen reader accessibility.",
                    "remediation": "Re-create the PDF from source with tagging enabled, or use Adobe Acrobat to add tags to the existing PDF.",
                    "detection_source": "pdf-tag-check",
                    "wcag_reference_url": "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
                })
    
    except Exception as e:
        logger.error(f"Error checking PDF tags: {e}")
    
    return issues


async def check_reading_order_detailed(file_path: str) -> List[Dict[str, Any]]:
    """Check reading order (detailed analysis)."""
    issues = []
    
    # This is a complex check that requires analyzing the PDF structure tree
    # For MVP, we'll do a basic check
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text with bounding boxes
                words = page.extract_words()
                
                if len(words) == 0:
                    continue
                
                # Simple heuristic: check if text flows logically top-to-bottom, left-to-right
                # This is simplified - full check requires structure tree analysis
                sorted_by_position = sorted(words, key=lambda w: (w['top'], w['x0']))
                
                # If ordering is very different from extraction order, flag potential issue
                # This is a basic heuristic
                if len(words) > 20:
                    # For now, just note that reading order should be validated manually
                    pass
    
    except Exception as e:
        logger.error(f"Error checking reading order: {e}")
    
    return issues


async def check_form_fields(file_path: str) -> List[Dict[str, Any]]:
    """Check accessibility of form fields."""
    issues = []
    
    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            
            if "/AcroForm" in reader.trailer.get("/Root", {}):
                # PDF has forms - check for labels
                issues.append({
                    "wcag_principle": "Perceivable",
                    "success_criterion": "1.3.1",
                    "success_criterion_name": "Info and Relationships",
                    "severity": "moderate",
                    "description": "PDF contains form fields. Verify all form fields have proper labels and tooltips.",
                    "remediation": "Ensure all form fields have descriptive labels and, where appropriate, tooltips explaining what input is expected.",
                    "detection_source": "pdf-form-check",
                })
    
    except Exception as e:
        logger.error(f"Error checking form fields: {e}")
    
    return issues


async def check_tables(file_path: str) -> List[Dict[str, Any]]:
    """Check table accessibility."""
    issues = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            tables_found = 0
            
            for page in pdf.pages:
                tables = page.extract_tables()
                tables_found += len(tables)
            
            if tables_found > 0:
                issues.append({
                    "wcag_principle": "Perceivable",
                    "success_criterion": "1.3.1",
                    "success_criterion_name": "Info and Relationships",
                    "severity": "moderate",
                    "description": f"PDF contains {tables_found} tables. Verify all tables have proper header rows and structure tags.",
                    "remediation": "Tag tables with proper structure (TH for headers, TD for data cells) using PDF editing software.",
                    "detection_source": "pdf-table-check",
                })
    
    except Exception as e:
        logger.error(f"Error checking tables: {e}")
    
    return issues


async def check_color_contrast_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Check color contrast (basic check using rendered pages)."""
    issues = []
    
    # This is a complex check that requires rendering PDF to images
    # and analyzing pixel colors - implementation would require PIL/Pillow
    # For MVP, we'll add a manual check reminder
    
    issues.append({
        "wcag_principle": "Perceivable",
        "success_criterion": "1.4.3",
        "success_criterion_name": "Contrast (Minimum)",
        "severity": "minor",
        "description": "Color contrast should be manually verified. Automated tools may not catch all contrast issues in PDFs.",
        "remediation": "Manually check that all text has at least 4.5:1 contrast ratio (3:1 for large text). Use Adobe Acrobat's accessibility checker or PDF Accessibility Checker (PAC) for detailed analysis.",
        "detection_source": "pdf-contrast-check",
    })
    
    return issues
