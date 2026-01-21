"""
PDF에서 그리드 라벨(A-F, 1-8) 위치 추출
"""
import fitz  # PyMuPDF
from pathlib import Path
import json

def extract_grid_labels(pdf_path):
    """PDF에서 그리드 라벨 추출"""
    doc = fitz.open(str(pdf_path))
    page = doc[0]

    # 페이지 크기
    rect = page.rect
    page_width = rect.width
    page_height = rect.height

    print(f"PDF 페이지 크기: {page_width:.2f} x {page_height:.2f} points")
    print("\n그리드 라벨 검색 중...\n")

    # 텍스트 추출
    text_instances = page.get_text("dict")

    row_labels = {}  # A-F (세로)
    col_labels = {}  # 1-8 (가로)

    # 모든 텍스트 블록 검사
    for block in text_instances["blocks"]:
        if block["type"] == 0:  # 텍스트 블록
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    bbox = span["bbox"]

                    # 중심점 계산
                    center_x = (bbox[0] + bbox[2]) / 2
                    center_y = (bbox[1] + bbox[3]) / 2

                    # 퍼센트 변환
                    x_percent = (center_x / page_width) * 100
                    y_percent = (center_y / page_height) * 100

                    # 행 라벨 (A-F) - 보통 왼쪽이나 오른쪽 가장자리
                    # 가장자리에 있는 것만 (좌우 5% 이내)
                    is_edge = x_percent < 5 or x_percent > 95

                    if text in ['A', 'B', 'C', 'D', 'E', 'F'] and is_edge:
                        if text not in row_labels:
                            row_labels[text] = []
                        row_labels[text].append({
                            'x': center_x,
                            'y': center_y,
                            'x_percent': x_percent,
                            'y_percent': y_percent,
                            'bbox': bbox
                        })
                        print(f"  행 {text}: ({x_percent:.1f}%, {y_percent:.1f}%)")

                    # 열 라벨 (1-8) - 보통 위쪽이나 아래쪽 가장자리
                    # 가장자리에 있는 것만 (상하 5% 이내)
                    is_edge_vertical = y_percent < 5 or y_percent > 95

                    if text in ['1', '2', '3', '4', '5', '6', '7', '8'] and is_edge_vertical:
                        if text not in col_labels:
                            col_labels[text] = []
                        col_labels[text].append({
                            'x': center_x,
                            'y': center_y,
                            'x_percent': x_percent,
                            'y_percent': y_percent,
                            'bbox': bbox
                        })
                        print(f"  열 {text}: ({x_percent:.1f}%, {y_percent:.1f}%)")

    doc.close()

    # 결과 정리 (여러 개 있으면 평균 사용)
    print("=" * 60)
    print("행 라벨 (A-F):")
    print("=" * 60)

    row_positions = {}
    for label in sorted(row_labels.keys()):
        positions = row_labels[label]
        avg_y_percent = sum(p['y_percent'] for p in positions) / len(positions)
        row_positions[label] = avg_y_percent
        print(f"  {label}: {avg_y_percent:.2f}% (발견: {len(positions)}개)")

    print("\n" + "=" * 60)
    print("열 라벨 (1-8):")
    print("=" * 60)

    col_positions = {}
    for label in sorted(col_labels.keys(), key=int):
        positions = col_labels[label]
        avg_x_percent = sum(p['x_percent'] for p in positions) / len(positions)
        col_positions[label] = avg_x_percent
        print(f"  {label}: {avg_x_percent:.2f}% (발견: {len(positions)}개)")

    return {
        'page_size': {'width': page_width, 'height': page_height},
        'rows': row_positions,
        'columns': col_positions
    }

def percent_to_grid_position(x_percent, y_percent, grid_data):
    """퍼센트 좌표를 그리드 위치로 변환"""
    rows = grid_data['rows']
    cols = grid_data['columns']

    # 행 찾기 (A-F)
    row_labels = sorted(rows.keys(), key=lambda k: rows[k])
    row = None
    for i, label in enumerate(row_labels):
        if i == 0 and y_percent < rows[label]:
            row = label
            break
        elif i == len(row_labels) - 1 and y_percent >= rows[label]:
            row = label
            break
        elif i < len(row_labels) - 1:
            curr_y = rows[label]
            next_y = rows[row_labels[i + 1]]
            mid_y = (curr_y + next_y) / 2
            if y_percent < mid_y:
                row = label
                break

    # 열 찾기 (1-8)
    col_labels = sorted(cols.keys(), key=lambda k: cols[k])
    col = None
    for i, label in enumerate(col_labels):
        if i == 0 and x_percent < cols[label]:
            col = label
            break
        elif i == len(col_labels) - 1 and x_percent >= cols[label]:
            col = label
            break
        elif i < len(col_labels) - 1:
            curr_x = cols[label]
            next_x = cols[col_labels[i + 1]]
            mid_x = (curr_x + next_x) / 2
            if x_percent < mid_x:
                col = label
                break

    if row and col:
        return f"{row}-{col}"
    return None

def main():
    pdf_path = Path(r"C:\Users\USER\Downloads\1M-PI-111-002  DH HE Condensate System-2rev2.pdf")

    if not pdf_path.exists():
        print(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return

    # 그리드 추출
    grid_data = extract_grid_labels(pdf_path)

    # JSON으로 저장
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\grid_positions.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(grid_data, f, indent=2, ensure_ascii=False)

    print(f"\n저장됨: {output_path}")

    # VG-4307 테스트 (19.4%, 20.67%)
    print("\n" + "=" * 60)
    print("테스트: VG-4307 위치 확인")
    print("=" * 60)

    test_x = 19.4
    test_y = 20.67
    grid_pos = percent_to_grid_position(test_x, test_y, grid_data)

    print(f"VG-4307: ({test_x}%, {test_y}%) → {grid_pos}")

if __name__ == "__main__":
    main()
