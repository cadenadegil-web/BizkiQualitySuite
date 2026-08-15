from pathlib import Path

# Carpeta raíz donde se almacenarán los archivos
UPLOAD_DIR = Path("uploads")

# Subcarpetas
FINDINGS_DIR = UPLOAD_DIR / "findings"
CAPAS_DIR = UPLOAD_DIR / "capas"
TEMP_DIR = UPLOAD_DIR / "temp"

# Crear automáticamente las carpetas
for directory in (
    UPLOAD_DIR,
    FINDINGS_DIR,
    CAPAS_DIR,
    TEMP_DIR,
):
    directory.mkdir(
        parents=True,
        exist_ok=True,
    )

# Configuración
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
}