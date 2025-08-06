import os
import docx
import PyPDF2
from PIL import Image
import pytesseract
from typing import Dict, Any

class FileProcessor:
    """文件处理器"""
    
    def __init__(self):
        self.supported_types = {
            '.txt': self._process_txt,
            '.pdf': self._process_pdf,
            '.docx': self._process_docx,
            '.jpg': self._process_image,
            '.jpeg': self._process_image,
            '.png': self._process_image
        }
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """提取文件文本内容"""
        if file_type not in self.supported_types:
            raise ValueError(f"不支持的文件类型: {file_type}")
        
        try:
            return self.supported_types[file_type](file_path)
        except Exception as e:
            raise Exception(f"文件处理失败: {str(e)}")
    
    def _process_txt(self, file_path: str) -> str:
        """处理TXT文件"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _process_pdf(self, file_path: str) -> str:
        """处理PDF文件"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            raise Exception(f"PDF处理失败: {str(e)}")
        
        return text
    
    def _process_docx(self, file_path: str) -> str:
        """处理DOCX文件"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"DOCX处理失败: {str(e)}")
    
    def _process_image(self, file_path: str) -> str:
        """处理图像文件（OCR）"""
        try:
            # 使用OCR提取图像中的文字
            image = Image.open(file_path)
            # 配置tesseract支持中文
            custom_config = r'--oem 3 --psm 6 -l chi_sim+eng'
            text = pytesseract.image_to_string(image, config=custom_config)
            return text
        except Exception as e:
            # 如果OCR失败，返回空字符串（图像处理可选）
            print(f"OCR处理失败: {str(e)}")
            return ""
    
    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """获取文件元数据"""
        stat = os.stat(file_path)
        return {
            'size': stat.st_size,
            'created_time': stat.st_ctime,
            'modified_time': stat.st_mtime,
            'extension': os.path.splitext(file_path)[1].lower()
        }