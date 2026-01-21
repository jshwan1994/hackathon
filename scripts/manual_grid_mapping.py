"""
수동으로 그리드 셀 경계를 정의하고 밸브 위치 매핑
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json

# 이미지 크기: 1639 x 1174
# 스크린샷에서 확인한 그리드: A-F (세로 6개), 1-8 (가로 8개)

# 수동으로 추정한 그리드 경계 (퍼센트)
# 이미지를 보고 대략적인 경계를 설정
GRID_ROWS = {
    'A': (0, 8),      # 0-8%
    'B': (8, 20),     # 8-20%
    'C': (20, 40),    # 20-40%
    'D': (40, 60),    # 40-60%
    'E': (60, 80),    # 60-80%
    'F': (80, 100),   # 80-100%
}

GRID_COLS = {
    '1': (0, 12.5),       # 0-12.5%
    '2': (12.5, 25),      # 12.5-25%
    '3': (25, 37.5),      # 25-37.5%
    '4': (37.5, 50),      # 37.5-50%
    '5': (50, 62.5),      # 50-62.5%
    '6': (62.5, 75),      # 62.5-75%
    '7': (75, 87.5),      # 75-87.5%
    '8': (87.5, 100),     # 87.5-100%
}

def get_grid_position(x_percent, y_percent):
    """퍼센트 좌표를 그리드 위치로 변환"""
    row = None
    col = None

    for row_label, (y_min, y_max) in GRID_ROWS.items():
        if y_min <= y_percent < y_max:
            row = row_label
            break

    for col_label, (x_min, x_max) in GRID_COLS.items():
        if x_min <= x_percent < x_max:
            col = col_label
            break

    if row and col:
        return f"{row}-{col}"
    return None

def visualize_grid(image_path, valve_data_path):
    """이미지에 그리드와 밸브 위치 표시"""
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    draw = ImageDraw.Draw(img)

    # 그리드 라인 그리기
    # 수평선 (행 구분)
    for row_label, (y_min, y_max) in GRID_ROWS.items():
        y_pixel = int((y_min / 100) * height)
        draw.line([(0, y_pixel), (width, y_pixel)], fill='cyan', width=2)
        draw.text((10, y_pixel + 5), row_label, fill='cyan')

    # 수직선 (열 구분)
    for col_label, (x_min, x_max) in GRID_COLS.items():
        x_pixel = int((x_min / 100) * width)
        draw.line([(x_pixel, 0), (x_pixel, height)], fill='cyan', width=2)
        draw.text((x_pixel + 5, 10), col_label, fill='cyan')

    # 밸브 데이터 로드
    with open(valve_data_path, 'r', encoding='utf-8') as f:
        valves = json.load(f)

    # 밸브 위치 표시
    for valve in valves:
        if 'position' not in valve:
            continue

        x_percent = valve['position']['x_percent']
        y_percent = valve['position']['y_percent']

        x_pixel = int((x_percent / 100) * width)
        y_pixel = int((y_percent / 100) * height)

        # 빨간 원
        r = 15
        draw.ellipse([x_pixel-r, y_pixel-r, x_pixel+r, y_pixel+r], outline='red', width=3)

        # 태그 라벨
        grid_pos = get_grid_position(x_percent, y_percent)
        label = f"{valve['tag']}\n{grid_pos}"
        draw.text((x_pixel + 20, y_pixel - 10), label, fill='red')

    # 저장
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\grid_visualization.png")
    img.save(output_path)
    print(f"그리드 시각화 저장: {output_path}")

    return output_path

def test_valves(valve_data_path):
    """모든 밸브의 그리드 위치 출력"""
    with open(valve_data_path, 'r', encoding='utf-8') as f:
        valves = json.load(f)

    print("=" * 70)
    print(f"{'Tag':<15} {'X%':<8} {'Y%':<8} {'Grid'}")
    print("=" * 70)

    for valve in valves:
        if 'position' not in valve:
            continue

        tag = valve['tag']
        x_percent = valve['position']['x_percent']
        y_percent = valve['position']['y_percent']
        grid_pos = get_grid_position(x_percent, y_percent)

        print(f"{tag:<15} {x_percent:<8.2f} {y_percent:<8.2f} {grid_pos}")

def main():
    image_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")
    valve_data_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\valve_data_new.json")

    print("모든 밸브의 그리드 위치:\n")
    test_valves(valve_data_path)

    print("\n그리드 시각화 생성 중...")
    output_path = visualize_grid(image_path, valve_data_path)

    print(f"\n{output_path}를 열어서 그리드가 맞는지 확인하세요!")
    print("\nVG-4307 확인:")
    print("  좌표: 19.4%, 20.67%")
    print("  추정 그리드:", get_grid_position(19.4, 20.67))

if __name__ == "__main__":
    main()
