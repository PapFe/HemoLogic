import easyocr
import fitz
import numpy as np
import cv2
import pandas as pd

PDF_FILE = "test.pdf"
OUTPUT_CSV = "ocr_results.csv"
LANGUAGES = ["hu", "en"]

CONFIDENCE_THRESHOLD = 0.01
ROW_GROUPING_TOLERANCE = 30
DPI = 600
MIN_TEXT_SIZE = 0
GPU_ENABLED = True


def run_ocr(pdf_path, is_correct_blood_test=True):
    if not is_correct_blood_test:
        raise ValueError(
            "Not the correct blood test type. This function only works with the specified blood data type."
        )

    reader = load_reader()
    doc = load_pdf(pdf_path)
    all_data = []

    for page_num, page in enumerate(doc):
        page_data = process_page(page, page_num, reader)
        if page_data is not None:
            all_data.extend(page_data)

    save_results(all_data)


def load_reader():
    print("1. EasyOCR betöltése (ez eltarthat pár másodpercig az első indításkor)...")
    return easyocr.Reader(LANGUAGES, gpu=GPU_ENABLED)


def load_pdf(pdf_file):
    print(f"2. PDF megnyitása: {pdf_file}")
    try:
        return fitz.open(pdf_file)
    except Exception as e:
        print(f"Hiba: Nem találom a PDF-et! ({e})")
        exit()


def group_detections_into_rows(detections):
    if not detections:
        return []
    rows = []
    current_row = [detections[0]]
    last_y = detections[0][0][0][1]

    for detection in detections[1:]:
        bbox, _text, _prob = detection
        y = bbox[0][1]
        if abs(y - last_y) > ROW_GROUPING_TOLERANCE:
            rows.append(current_row)
            current_row = [detection]
            last_y = y
        else:
            current_row.append(detection)

    if current_row:
        rows.append(current_row)
    return rows


def find_header_index(rows):
    for i, row in enumerate(rows):
        texts = [text for _, text, _ in row]
        if "Vizsgálat" in [t.strip() for t in texts]:
            return i
    return None


def extract_data_from_rows(rows, header_index, page_num):
    page_data = []
    if header_index is not None:
        data_rows = rows[header_index + 1 :]
    else:
        data_rows = rows

    for row in data_rows:
        if not row:
            continue
        row.sort(key=lambda x: x[0][0][0])
        print(f"Row: {row}")
        texts = [text.strip() for _, text, _ in row]
        print(f"Texts: {texts}")
        eredmeny_idx = None
        for i, text in enumerate(texts):
            try:
                cleaned = text.replace(",", ".").replace(" ", "").replace("..", ".")

                if ">" in cleaned:
                    cleaned = cleaned.replace(">", "")
                float(cleaned)
                print(f"Cleaned: {cleaned}")
                eredmeny_idx = i
                break
            except ValueError:
                pass
        if eredmeny_idx is not None:
            if eredmeny_idx == 0:
                # Number is first, name after
                vizsgalat = " ".join(texts[1:]).strip()
                eredmeny = texts[0].strip()
            else:
                vizsgalat = " ".join(texts[:eredmeny_idx]).strip()
                print(f"Vizsgálat else: {vizsgalat}")
                eredmeny = texts[eredmeny_idx].strip()
            if eredmeny_idx > 0 and texts[eredmeny_idx - 1] in ["<", ">", "<=", ">="]:
                if eredmeny_idx == 1:
                    vizsgalat = " ".join(texts[1:]).strip()
                    print(f"Vizsgálat if: {vizsgalat}")

                    eredmeny = texts[0] + texts[1]
                else:
                    vizsgalat = " ".join(texts[: eredmeny_idx - 1]).strip()
                    print(f"Vizsgálat else 2: {vizsgalat}")

                    eredmeny = texts[eredmeny_idx - 1] + texts[eredmeny_idx]
            eredmeny = eredmeny.replace(",", ".").replace(" ", "").replace("..", ".")
            if ">" in eredmeny:
                eredmeny = eredmeny.replace(">", "")
            print(f"Vizsgalat: {vizsgalat}")
            print(f"Eredmény: {eredmeny}")
            if not vizsgalat or vizsgalat in ["<", ">", "<=", ">="]:
                continue
            page_data.append(
                {
                    "page": page_num + 1,
                    "Vizsgálat": vizsgalat,
                    "Eredmény": eredmeny,
                }
            )
        else:
            pass
    return page_data


def process_page(page, page_num, reader):
    print(f"\n--- {page_num + 1}. oldal feldolgozása... ---")

    pix = page.get_pixmap(dpi=DPI, alpha=False)
    img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)

    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    cv2.imwrite(f"debug_easyocr_oldal_{page_num + 1}.jpg", img_cv)

    # Sharpen the image mildly
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    img_cv = cv2.filter2D(img_cv, -1, kernel)

    # Enhance with CLAHE
    img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    img_gray = clahe.apply(img_gray)
    cv2.imwrite(f"debug_easyocr_enhanced_{page_num + 1}.jpg", img_gray)

    # Use grayscale for OCR
    img_array = img_gray

    print("Olvasás folyamatban...")
    result = reader.readtext(
        img_array, detail=1, paragraph=False, min_size=MIN_TEXT_SIZE
    )

    if not result:
        print("  Nincs találat ezen az oldalon.")
        return []

    detections = []
    count = 0
    for bbox, text, prob in result:
        if prob > CONFIDENCE_THRESHOLD:
            detections.append((bbox, text, prob))
            count += 1

    print(f"  >> Összesen {count} sort találtam.")

    rows = group_detections_into_rows(detections)

    header_index = find_header_index(rows)

    page_data = extract_data_from_rows(rows, header_index, page_num)

    for bbox, text, prob in detections:
        try:
            top_left = tuple(map(int, bbox[0]))
            bottom_right = tuple(map(int, bbox[2]))
            cv2.rectangle(img_cv, top_left, bottom_right, (0, 255, 0), 2)
        except Exception:
            pass

    cv2.imwrite(f"debug_easyocr_eredmeny_{page_num + 1}.jpg", img_cv)

    return page_data


def save_results(data):
    processed_data = []
    for item in data:
        name = item["Vizsgálat"]
        value = item["Eredmény"].replace(",", ".").replace(" ", ".").replace("..", ".")

        if name in [
            "Eredmény",
            "Minősítés",
            "Referencia*",
            "Mértékegység",
            "Vizsgálat",
        ]:
            continue

        # Clean name
        name = name.replace("vól", "ból")
        if name.count("(") > name.count(")"):
            name += ")"
        if name.count("[") > name.count("]"):
            name += "]"
        name = " ".join(name.split())  # normalize spaces

        # Dynamic corrections based on detected patterns
        if "Plazmából" in name:
            name = name.split(" Plazmából")[0]
            value = "Plazmából mérve"
        if "Glükóz (éhgyomri,0 perces)" in name:
            name = name.replace(
                "Glükóz (éhgyomri,0 perces)",
                "Glükóz (éhgyomri, 0 perces vércukor) - plazma",
            )

        processed_data.append(
            {
                "Vizsgálat": name,
                "Eredmény": value,
            }
        )

    # Merge broken Vizsgálat
    merged_data = []
    i = 0
    while i < len(processed_data):
        item = processed_data[i]
        if (
            item["Vizsgálat"].endswith(",") or not item["Vizsgálat"].endswith(")")
        ) and i + 1 < len(processed_data):
            next_item = processed_data[i + 1]
            if next_item["Vizsgálat"] and (
                next_item["Vizsgálat"][0].islower()
                or next_item["Vizsgálat"][0].isdigit()
            ):
                item["Vizsgálat"] += " " + next_item["Vizsgálat"]
                i += 1  # skip next
        merged_data.append(item)
        i += 1

    # Filter out invalid rows where name starts with digit
    # filtered_data = [item for item in merged_data if not item["Vizsgálat"].startswith(tuple('0123456789'))]
    filtered_data = merged_data

    df = pd.DataFrame(filtered_data)
    print(
        f"\n✅ KÉSZ! Összesen {len(filtered_data)} tábla sort gyűjtöttem pandas DataFrame-be."
    )
    print(df.head())
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"Az eredményeket elmentettem: {OUTPUT_CSV}")
    print("Nézd meg a 'debug_easyocr_eredmeny_1.jpg' képet is!")


def main():
    run_ocr(PDF_FILE, is_correct_blood_test=True)


if __name__ == "__main__":
    main()
