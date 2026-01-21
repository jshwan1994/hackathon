"""
P&ID 도면에서 밸브 태그를 OCR로 추출하는 개선된 스크립트
"""
import cv2
import pytesseract
import numpy as np
import json
import csv
import re
from pathlib import Path

# Tesseract 경로 설정
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image_enhanced(image_path):
    """개선된 이미지 전처리"""
    # 이미지 읽기
    img = cv2.imread(str(image_path))

    # 이미지 크기 확대 (OCR 정확도 향상)
    scale_factor = 2.0
    width = int(img.shape[1] * scale_factor)
    height = int(img.shape[0] * scale_factor)
    img = cv2.resize(img, (width, height), interpolation=cv2.INTER_CUBIC)

    # 그레이스케일 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 대비 향상 (CLAHE - Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # 이진화 (Otsu's method)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 모폴로지 연산으로 텍스트 강조
    kernel = np.ones((1,1), np.uint8)
    processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return img, processed

def is_valve_tag(text):
    """밸브 태그인지 확인"""
    text = text.strip().upper()

    if len(text) < 3 or len(text) > 20:
        return False

    # P&ID 도면의 일반적인 태그 패턴
    patterns = [
        r'^[A-Z]{1,3}-\d{3,5}[A-Z]?$',      # V-001, HV-6003, FV-7013A
        r'^[A-Z]{2,3}\d{3,5}$',              # HV6003, FV7013
        r'^\d{3}-[A-Z]-[A-Z]{2}-\d{3}$',    # 111-M-PP-001
        r'^[A-Z]{2}-\d{4}$',                 # VC-0001
        r'^[A-Z]-\d{3,4}$',                  # V-102
    ]

    for pattern in patterns:
        if re.match(pattern, text):
            return True

    # 일반적인 밸브 접두사 확인
    valve_prefixes = ['V-', 'HV-', 'FV-', 'LV-', 'PV-', 'TV-', 'CV-', 'VC-', 'XV-', 'SV-']
    for prefix in valve_prefixes:
        if text.startswith(prefix):
            return True

    return False

def extract_with_multiple_configs(processed_img):
    """여러 OCR 설정으로 시도"""
    results = []

    # 다양한 PSM (Page Segmentation Mode) 설정 시도
    psm_configs = [
        '--psm 11',  # Sparse text
        '--psm 6',   # Uniform block of text
        '--psm 3',   # Fully automatic page segmentation
        '--psm 12',  # Sparse text with OSD
    ]

    for config in psm_configs:
        try:
            data = pytesseract.image_to_data(
                processed_img,
                output_type=pytesseract.Output.DICT,
                config=config
            )
            results.append(data)
        except:
            continue

    return results

def extract_valve_tags(image_path, output_dir):
    """도면에서 밸브 태그 추출"""
    print(f"Processing: {image_path}")

    # 이미지 전처리
    original_img, processed_img = preprocess_image_enhanced(image_path)
    height, width = processed_img.shape

    # 여러 설정으로 OCR 시도
    all_results = extract_with_multiple_configs(processed_img)

    valve_tags = []
    found_tags = set()

    # 모든 결과 통합
    for data in all_results:
        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            conf = int(data['conf'][i]) if data['conf'][i] != '-1' else 0

            # 신뢰도가 낮거나 빈 텍스트는 무시
            if conf < 20 or not text:
                continue

            # 밸브 태그인지 확인
            if is_valve_tag(text):
                text_upper = text.upper()

                # 중복 방지
                if text_upper in found_tags:
                    continue

                found_tags.add(text_upper)

                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]

                # 정규화된 좌표
                x_percent = (x / width) * 100
                y_percent = (y / height) * 100
                w_percent = (w / width) * 100
                h_percent = (h / height) * 100

                valve_type = text_upper.split('-')[0] if '-' in text_upper else 'UNKNOWN'

                valve_info = {
                    'tag': text_upper,
                    'type': valve_type,
                    'page': Path(image_path).stem,
                    'confidence': conf,
                    'bbox': {
                        'x': round(x_percent, 2),
                        'y': round(y_percent, 2),
                        'width': round(w_percent, 2),
                        'height': round(h_percent, 2)
                    },
                    'bbox_pixels': {
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h
                    }
                }

                valve_tags.append(valve_info)
                print(f"  Found: {text_upper} (confidence: {conf}%)")

    # JSON 저장
    json_path = output_dir / f"{Path(image_path).stem}_tags.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(valve_tags, f, indent=2, ensure_ascii=False)

    # CSV 저장
    csv_path = output_dir / f"{Path(image_path).stem}_tags.csv"
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        if valve_tags:
            fieldnames = ['tag', 'type', 'page', 'confidence', 'x_percent', 'y_percent',
                         'width_percent', 'height_percent', 'x_pixels', 'y_pixels']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for tag in valve_tags:
                row = {
                    'tag': tag['tag'],
                    'type': tag['type'],
                    'page': tag['page'],
                    'confidence': tag['confidence'],
                    'x_percent': tag['bbox']['x'],
                    'y_percent': tag['bbox']['y'],
                    'width_percent': tag['bbox']['width'],
                    'height_percent': tag['bbox']['height'],
                    'x_pixels': tag['bbox_pixels']['x'],
                    'y_pixels': tag['bbox_pixels']['y']
                }
                writer.writerow(row)

    print(f"\nTotal: {len(valve_tags)} valve tags found")
    print(f"JSON saved: {json_path}")
    print(f"CSV saved: {csv_path}")

    return valve_tags

def main():
    image_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")
    output_dir = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output")
    output_dir.mkdir(exist_ok=True)

    if not image_path.exists():
        print(f"[ERROR] Image file not found: {image_path}")
        return

    valve_tags = extract_valve_tags(image_path, output_dir)

    # 결과 요약
    print("\n" + "="*60)
    print("Extracted Valve Tags:")
    print("="*60)
    for tag in sorted(valve_tags, key=lambda x: x['tag']):
        print(f"{tag['tag']:20} | Position: ({tag['bbox']['x']:6.2f}%, {tag['bbox']['y']:6.2f}%) | Conf: {tag['confidence']}%")

    if len(valve_tags) == 0:
        print("\nNo valve tags found. The image might need manual annotation.")
        print("Consider using a specialized P&ID tag extraction tool or manual labeling.")

if __name__ == "__main__":
    main()
