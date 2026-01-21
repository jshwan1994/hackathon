"""
P&ID 도면에서 밸브 태그를 OCR로 추출하는 스크립트
"""
import cv2
import pytesseract
import numpy as np
import json
import csv
import re
from pathlib import Path

# Tesseract 경로 설정 (Windows 기준)
# 설치되어 있지 않다면: https://github.com/UB-Mannheim/tesseract/wiki
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    """이미지 전처리"""
    # 이미지 읽기
    img = cv2.imread(str(image_path))

    # 그레이스케일 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 이진화 (임계값 적용)
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    # 노이즈 제거
    denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)

    return img, denoised

def is_valve_tag(text):
    """밸브 태그인지 확인하는 함수"""
    # 일반적인 밸브 태그 패턴
    # 예: V-0001, HV-6003, FV-7013, VC-0001, etc.
    patterns = [
        r'^[A-Z]{1,3}-\d{3,4}[A-Z]?$',  # V-001, HV-6003, FV-7013A
        r'^[A-Z]{2,3}\d{3,4}$',          # HV6003, FV7013
        r'^\d{3}-[A-Z]{1,2}-[A-Z]{2}-\d{3}$',  # 111-M-PP-001
    ]

    text = text.strip().upper()

    for pattern in patterns:
        if re.match(pattern, text):
            return True
    return False

def extract_valve_tags(image_path, output_dir):
    """도면에서 밸브 태그 추출"""
    print(f"처리 중: {image_path}")

    # 이미지 전처리
    original_img, processed_img = preprocess_image(image_path)
    height, width = processed_img.shape

    # OCR 수행 (상세 정보 포함)
    data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT,
                                      config='--psm 11')

    # 결과 저장
    valve_tags = []

    # 각 감지된 텍스트 처리
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        conf = int(data['conf'][i])

        # 신뢰도가 낮거나 빈 텍스트는 무시
        if conf < 30 or not text:
            continue

        # 밸브 태그인지 확인
        if is_valve_tag(text):
            x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]

            # 정규화된 좌표 (0-100 범위)
            x_percent = (x / width) * 100
            y_percent = (y / height) * 100
            w_percent = (w / width) * 100
            h_percent = (h / height) * 100

            valve_info = {
                'tag': text.upper(),
                'type': text.split('-')[0] if '-' in text else 'UNKNOWN',
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
            print(f"  발견: {text} (신뢰도: {conf}%)")

    # 중복 제거 (같은 태그가 여러 번 검출될 수 있음)
    unique_tags = {}
    for tag in valve_tags:
        tag_name = tag['tag']
        if tag_name not in unique_tags or tag['confidence'] > unique_tags[tag_name]['confidence']:
            unique_tags[tag_name] = tag

    valve_tags = list(unique_tags.values())

    # JSON으로 저장
    json_path = output_dir / f"{Path(image_path).stem}_tags.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(valve_tags, f, indent=2, ensure_ascii=False)

    # CSV로 저장
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

    print(f"\n총 {len(valve_tags)}개의 밸브 태그 발견")
    print(f"JSON 저장: {json_path}")
    print(f"CSV 저장: {csv_path}")

    return valve_tags

def main():
    # 경로 설정
    image_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")
    output_dir = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output")
    output_dir.mkdir(exist_ok=True)

    if not image_path.exists():
        print(f"[ERROR] Image file not found: {image_path}")
        print("Please save the image to:")
        print(f"  {image_path}")
        return

    # 밸브 태그 추출
    valve_tags = extract_valve_tags(image_path, output_dir)

    # 결과 요약
    print("\n" + "="*50)
    print("추출된 밸브 태그:")
    print("="*50)
    for tag in sorted(valve_tags, key=lambda x: x['tag']):
        print(f"{tag['tag']:15} | 위치: ({tag['bbox']['x']:6.2f}%, {tag['bbox']['y']:6.2f}%) | 신뢰도: {tag['confidence']}%")

if __name__ == "__main__":
    main()
