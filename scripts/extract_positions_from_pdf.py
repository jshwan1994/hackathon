"""
Searchable PDF에서 밸브 태그 위치 추출
"""
import fitz  # PyMuPDF
from pathlib import Path
import json

def extract_valve_positions_from_pdf(pdf_path):
    """PDF에서 밸브 태그와 위치 추출"""
    doc = fitz.open(str(pdf_path))

    # 첫 페이지만 사용
    page = doc[0]

    # 페이지 크기
    rect = page.rect
    page_width = rect.width
    page_height = rect.height

    print(f"PDF 페이지 크기: {page_width:.2f} x {page_height:.2f} points")

    # 텍스트 추출 (위치 정보 포함)
    text_instances = page.get_text("dict")

    valve_positions = []

    # 모든 텍스트 블록 검사
    for block in text_instances["blocks"]:
        if block["type"] == 0:  # 텍스트 블록
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()

                    # 밸브 태그 패턴 체크
                    if any(text.startswith(prefix) for prefix in ["VC-", "VL-", "VG-", "VB-", "HV-", "FV-"]):
                        # 바운딩 박스
                        bbox = span["bbox"]

                        # 중심점 계산
                        center_x = (bbox[0] + bbox[2]) / 2
                        center_y = (bbox[1] + bbox[3]) / 2

                        # 퍼센트 변환
                        x_percent = (center_x / page_width) * 100
                        y_percent = (center_y / page_height) * 100

                        valve_positions.append({
                            "tag": text,
                            "bbox": bbox,
                            "center": (center_x, center_y),
                            "percent": (x_percent, y_percent)
                        })

                        print(f"{text:20} | PDF: ({center_x:7.2f}, {center_y:7.2f}) | %: ({x_percent:6.2f}%, {y_percent:6.2f}%)")

    doc.close()
    return valve_positions, page_width, page_height

def main():
    pdf_path = Path(r"C:\Users\USER\Downloads\1M-PI-111-002  DH HE Condensate System-2rev2.pdf")

    if not pdf_path.exists():
        print(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return

    print("PDF에서 밸브 위치 추출 중...\n")
    valve_positions, page_width, page_height = extract_valve_positions_from_pdf(pdf_path)

    print(f"\n총 {len(valve_positions)}개의 밸브 태그 발견")

    # VC-0581 특별히 출력
    print("\n" + "="*60)
    vc_0581 = [v for v in valve_positions if "VC-0581" in v["tag"]]
    if vc_0581:
        v = vc_0581[0]
        print(f"VC-0581 위치:")
        print(f"  PDF 좌표: ({v['center'][0]:.2f}, {v['center'][1]:.2f})")
        print(f"  퍼센트: ({v['percent'][0]:.2f}%, {v['percent'][1]:.2f}%)")

    # JSON으로 저장
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\valve_positions_from_pdf.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "page_size": {"width": page_width, "height": page_height},
            "valves": valve_positions
        }, f, indent=2, ensure_ascii=False)

    print(f"\n저장됨: {output_path}")

if __name__ == "__main__":
    main()
