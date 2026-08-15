from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import HTTPException
from fastapi import UploadFile


# =====================================================
# Configuración
# =====================================================

BASE_STORAGE = Path("storage")

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

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# =====================================================
# Crear directorio
# =====================================================

def ensure_directory(folder: str) -> Path:

    directory = BASE_STORAGE / folder

    directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    return directory


# =====================================================
# Obtener extensión
# =====================================================

def get_extension(
    filename: str,
) -> str:

    return Path(filename).suffix.lower()


# =====================================================
# Validar extensión
# =====================================================

def validate_extension(
    filename: str,
):

    extension = get_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida: {extension}",
        )


# =====================================================
# Guardar archivo
# =====================================================

def save_file(
    file: UploadFile,
    folder: str,
):

    validate_extension(
        file.filename,
    )

    directory = ensure_directory(
        folder,
    )

    extension = get_extension(
        file.filename,
    )

    stored_name = (
        f"{uuid4()}{extension}"
    )

    storage_path = directory / stored_name

    with storage_path.open(
        "wb",
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer,
        )

    if storage_path.stat().st_size > MAX_FILE_SIZE:

        storage_path.unlink(
            missing_ok=True,
        )

        raise HTTPException(
            status_code=400,
            detail="El archivo supera el tamaño máximo permitido (20 MB).",
        )

    return (
        stored_name,
        str(storage_path),
    )


# =====================================================
# Eliminar archivo
# =====================================================

def delete_file(
    path: str,
):

    file = Path(path)

    if file.exists():

        file.unlink()


# =====================================================
# Verificar existencia
# =====================================================

def file_exists(
    path: str,
) -> bool:

    return Path(path).exists()


# =====================================================
# Obtener tamaño
# =====================================================

def get_file_size(
    path: str,
) -> int:

    return Path(path).stat().st_size