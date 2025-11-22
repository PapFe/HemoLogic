import cv2
import numpy as np
from pdf2image import convert_from_path
from pathlib import Path
from PIL import Image
import time  # ← idő méréshez



def classify(input_path="",POPPLER_PATH = r"Release-25.11.0-0\poppler-25.11.0\Library\bin"):

    if not input_path:
        return False

    # PIL limit növelése (nagy PDF-ekhez)
    Image.MAX_IMAGE_PIXELS = None
    start_time = time.time()
    ext = Path(input_path).suffix.lower()
    if ext == ".pdf":
        pages = convert_from_path(
            input_path,
            dpi=200,  # 150–200 is often enough for OCR, much faster than 300
            poppler_path=POPPLER_PATH,
            fmt="jpeg",  # or "png", but jpeg is usually faster/smaller
            thread_count=4,  # use multiple cores (try 4 or more)
            use_pdftocairo=True,  # faster renderer in many cases
            first_page=1,
            last_page=2,  # if you only need the first 2 pages
        )
        page_image = np.array(pages[0])
    elif ext in [".jpg", ".jpeg", ".png", ".bmp"]:
        page_image = cv2.imread(input_path)
        page_image = cv2.cvtColor(page_image, cv2.COLOR_BGR2RGB)
    else:
        raise ValueError("Nem támogatott fájlformátum!")

    # ---------- Szürkeárnyalat ----------
    page_image_gray = cv2.cvtColor(page_image, cv2.COLOR_RGB2GRAY)
    height, width = page_image_gray.shape
    # ---------- Template matching ----------
    logo_color = cv2.imread("logo3.png")
    logo_gray = cv2.cvtColor(logo_color, cv2.COLOR_BGR2GRAY)
    end_time2 = time.time()

    res = cv2.matchTemplate(page_image_gray, logo_gray, cv2.TM_CCOEFF_NORMED)
    threshold = 0.4
    loc = np.where(res >= threshold)

    # ⏱ Időmérés end
    end_time = time.time()
    elapsed_time = end_time - start_time
    if len(loc[0]) > 0:
        return True,elapsed_time
    else:
        return False,elapsed_time
