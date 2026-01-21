"""
PNG 이미지에 VC-0581 위치 표시
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# 이미지 로드
img_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")
img = Image.open(img_path).convert('RGB')
width, height = img.size

print(f"이미지 크기: {width} x {height}")

# VC-0581 위치 (PNG 좌표, %)
x_percent = 23.40
y_percent = 44.38

# 픽셀 좌표로 변환
x_pixel = int((x_percent / 100) * width)
y_pixel = int((y_percent / 100) * height)

print(f"VC-0581 위치: {x_percent}%, {y_percent}%")
print(f"픽셀 좌표: ({x_pixel}, {y_pixel})")

# 그리기
draw = ImageDraw.Draw(img)

# 빨간 원 그리기
r = 30
draw.ellipse([x_pixel-r, y_pixel-r, x_pixel+r, y_pixel+r], outline='red', width=5)

# 작은 중심점
draw.ellipse([x_pixel-5, y_pixel-5, x_pixel+5, y_pixel+5], fill='red')

# 라벨
try:
    # 폰트 크기 큰 텍스트
    draw.text((x_pixel + 40, y_pixel - 10), "VC-0581", fill='red')
except:
    pass

# 저장
output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\png_with_marker.png")
img.save(output_path)
print(f"\n저장됨: {output_path}")
print("이 이미지를 열어서 빨간 원이 VC-0581 위치에 정확히 있는지 확인하세요!")
