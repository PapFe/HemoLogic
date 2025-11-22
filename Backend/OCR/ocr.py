import easyocr
import fitz
import numpy as np
import cv2
import pandas as pd
from pathlib import Path
import tempfile
import os
import OCR_engine
import json
PDF_FILE = "test.pdf"
OUTPUT_CSV = "ocr_results.csv"
LANGUAGES = ["hu", "en"]

CONFIDENCE_THRESHOLD = 0.01
ROW_GROUPING_TOLERANCE = 30
DPI = 600
MIN_TEXT_SIZE = 0
GPU_ENABLED = True
template_json = """
{
  "measurements": [
    {"name":"Fehérvérsejtszám","lower_limit":4.4,"upper_limit":11.3,"unit":"Giga/L","value":""},
    {"name":"Vörösvérsejtszám","lower_limit":4.5,"upper_limit":5.9,"unit":"Tera/L","value":""},
    {"name":"Hemoglobin","lower_limit":140,"upper_limit":175,"unit":"g/L","value":""},
    {"name":"Hematokrit","lower_limit":0.4,"upper_limit":0.52,"unit":"L/L","value":""},
    {"name":"MCV","lower_limit":80,"upper_limit":96,"unit":"fL","value":""},
    {"name":"MCH","lower_limit":28,"upper_limit":33,"unit":"pg","value":""},
    {"name":"MCHC","lower_limit":310,"upper_limit":370,"unit":"g/L","value":""},
    {"name":"Trombocitaszám","lower_limit":150,"upper_limit":450,"unit":"Giga/L","value":""},
    {"name":"RDW-CV","lower_limit":11.6,"upper_limit":15.6,"unit":"%","value":""},
    {"name":"MPV","lower_limit":7.2,"upper_limit":13,"unit":"fL","value":""},
    {"name":"Neutrofil granulocita %","lower_limit":50,"upper_limit":70,"unit":"%","value":""},
    {"name":"Limfocita %","lower_limit":25,"upper_limit":40,"unit":"%","value":""},
    {"name":"Monocita %","lower_limit":2,"upper_limit":8,"unit":"%","value":""},
    {"name":"Eozinofil granulocita %","lower_limit":1,"upper_limit":4,"unit":"%","value":""},
    {"name":"Bazofil granulocita %","lower_limit":0,"upper_limit":1,"unit":"%","value":""},
    {"name":"Neutrofil granulocita #","lower_limit":2.2,"upper_limit":7.9,"unit":"Giga/L","value":""},
    {"name":"Limfocita #","lower_limit":1.1,"upper_limit":4.5,"unit":"Giga/L","value":""},
    {"name":"Monocita #","lower_limit":0.1,"upper_limit":0.9,"unit":"Giga/L","value":""},
    {"name":"Eozinofil granulocita #","lower_limit":0.05,"upper_limit":0.45,"unit":"Giga/L","value":""},
    {"name":"Bazofil granulocita #","lower_limit":0,"upper_limit":0.1,"unit":"Giga/L","value":""},
    {"name":"Glükóz (éhgyomri vércukor)","lower_limit":3.7,"upper_limit":6,"unit":"mmol/L","value":""},
    {"name":"Glükóz (éhgyomri, 0 perces vércukor) - plazma","lower_limit":3.7,"upper_limit":6,"unit":"mmol/L","value":""},
    {"name":"Hemoglobin A1c (NGSP)","lower_limit":4,"upper_limit":5.6,"unit":"%","value":""},
    {"name":"Hemoglobin A1c (IFCC)","lower_limit":20,"upper_limit":39,"unit":"mmol/mol","value":""},
    {"name":"Karbamid","lower_limit":2.8,"upper_limit":7.2,"unit":"mmol/L","value":""},
    {"name":"Kreatinin","lower_limit":64,"upper_limit":104,"unit":"umol/L","value":""},
    {"name":"eGFR-EPI","lower_limit":90,"upper_limit":null,"unit":"mL/min/1.73m2","value":""},
    {"name":"Húgysav","lower_limit":208,"upper_limit":428,"unit":"umol/L","value":""},
    {"name":"Nátrium (Na)","lower_limit":136,"upper_limit":146,"unit":"mmol/L","value":""},
    {"name":"Kálium (K)","lower_limit":3.5,"upper_limit":5.1,"unit":"mmol/L","value":""},
    {"name":"Összfehérje","lower_limit":66,"upper_limit":83,"unit":"g/L","value":""},
    {"name":"Albumin","lower_limit":35,"upper_limit":52,"unit":"g/L","value":""},
    {"name":"C reaktív protein (CRP)","lower_limit":null,"upper_limit":5,"unit":"mg/L","value":""},
    {"name":"C reaktív protein ultraszenzitív (hsCRP)","lower_limit":0.1,"upper_limit":1,"unit":"mg/L","value":""},
    {"name":"Vas (Fe)","lower_limit":12.5,"upper_limit":32.2,"unit":"umol/L","value":""},
    {"name":"Transzferrin","lower_limit":2,"upper_limit":3.6,"unit":"g/L","value":""},
    {"name":"Transzferrin szaturáció","lower_limit":20,"upper_limit":55,"unit":"%","value":""},
    {"name":"Koleszterin","lower_limit":null,"upper_limit":5.2,"unit":"mmol/L","value":""},
    {"name":"Trigliceridák","lower_limit":null,"upper_limit":1.71,"unit":"mmol/L","value":""},
    {"name":"Non HDL koleszterin","lower_limit":null,"upper_limit":4.1,"unit":"mmol/L","value":""},
    {"name":"HDL koleszterin","lower_limit":1.04,"upper_limit":null,"unit":"mmol/L","value":""},
    {"name":"LDL koleszterin","lower_limit":null,"upper_limit":3.34,"unit":"mmol/L","value":""},
    {"name":"Totál bilirubin","lower_limit":5,"upper_limit":21,"unit":"umol/L","value":""},
    {"name":"GOT (ASAT)","lower_limit":null,"upper_limit":50,"unit":"U/L","value":""},
    {"name":"GPT (ALAT)","lower_limit":null,"upper_limit":50,"unit":"U/L","value":""},
    {"name":"Gamma GT (GGT)","lower_limit":null,"upper_limit":55,"unit":"U/L","value":""},
    {"name":"Alkalitikus foszfatáz","lower_limit":40,"upper_limit":129,"unit":"U/L","value":""},
    {"name":"D vitamin (25OH)","lower_limit":75,"upper_limit":null,"unit":"nmol/L","value":""},
    {"name":"B12 vitamin","lower_limit":156,"upper_limit":672,"unit":"pmol/L","value":""},
    {"name":"Fólsav","lower_limit":12.19,"upper_limit":null,"unit":"nmol/L","value":""}
  ]
}
"""
template = json.loads(template_json)
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

    res = save_results(all_data)

    return res


def load_reader():
    #print("1. EasyOCR betöltése (ez eltarthat pár másodpercig az első indításkor)...")
    return easyocr.Reader(LANGUAGES, gpu=GPU_ENABLED)


def load_pdf(pdf_file):
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
        texts = [text.strip() for _, text, _ in row]

        eredmeny_idx = None
        for i, text in enumerate(texts):
            try:
                cleaned = text.replace(",", ".").replace(" ", "").replace("..", ".")

                if ">" in cleaned:
                    cleaned = cleaned.replace(">", "")
                float(cleaned)

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

                eredmeny = texts[eredmeny_idx].strip()
            if eredmeny_idx > 0 and texts[eredmeny_idx - 1] in ["<", ">", "<=", ">="]:
                if eredmeny_idx == 1:
                    vizsgalat = " ".join(texts[1:]).strip()


                    eredmeny = texts[0] + texts[1]
                else:
                    vizsgalat = " ".join(texts[: eredmeny_idx - 1]).strip()


                    eredmeny = texts[eredmeny_idx - 1] + texts[eredmeny_idx]
            eredmeny = eredmeny.replace(",", ".").replace(" ", "").replace("..", ".")
            if ">" in eredmeny:
                eredmeny = eredmeny.replace(">", "")

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

    pix = page.get_pixmap(dpi=DPI, alpha=False)
    img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)

    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    #cv2.imwrite(f"debug_easyocr_oldal_{page_num + 1}.jpg", img_cv)

    # Sharpen the image mildly
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    img_cv = cv2.filter2D(img_cv, -1, kernel)

    # Enhance with CLAHE
    img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    img_gray = clahe.apply(img_gray)
    #cv2.imwrite(f"debug_easyocr_enhanced_{page_num + 1}.jpg", img_gray)

    # Use grayscale for OCR
    img_array = img_gray

    result = reader.readtext(
        img_array, detail=1, paragraph=False, min_size=MIN_TEXT_SIZE
    )

    if not result:
        return []

    detections = []
    count = 0
    for bbox, text, prob in result:
        if prob > CONFIDENCE_THRESHOLD:
            detections.append((bbox, text, prob))
            count += 1



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

    #cv2.imwrite(f"debug_easyocr_eredmeny_{page_num + 1}.jpg", img_cv)

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

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    return df_to_JSON(df)#OCR_engine.make_mock_data("hello.pdf")

    #df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
import re
def normalize_name(s: str) -> str:
    """
    Make names comparable:
    - lowercase
    - remove spaces, commas, hyphens, quotes
    - collapse multiple spaces
    """
    if not isinstance(s, str):
        return ""
    s = s.lower()
    # unify some punctuation / spacing
    s = s.replace("(", " ").replace(")", " ")
    s = s.replace("-", " ")
    s = s.replace(",", " ")
    s = s.replace("  ", " ")
    # remove all whitespace
    s = re.sub(r"\s+", "", s)
    return s

import copy

def df_to_JSON(df):
    value_by_name = {}

    for _, row in df.iterrows():
        raw_name = str(row["Vizsgálat"])
        norm = normalize_name(raw_name)
        value_by_name[norm] = str(row["Eredmény"]).strip()

    # Work on a COPY so we don't mutate the global template
    template_copy = copy.deepcopy(template)

    unmatched = []

    for m in template_copy["measurements"]:
        norm_name = normalize_name(m["name"])
        if norm_name in value_by_name:
            m["value"] = value_by_name[norm_name]
        else:
            unmatched.append(m["name"])

    print("Unmatched template names:")
    for name in unmatched:
        print("  -", name)

    # ✅ Return a Python dict, NOT a JSON string
    return template_copy




