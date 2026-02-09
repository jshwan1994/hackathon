#!/usr/bin/env python3
"""
P&ID 배관 네트워크 분석 스크립트
- 배관 라인을 그래프로 변환
- 밸브 간 연결 경로 추적
- 격리 밸브 자동 추천
"""

import ezdxf
import json
import re
from pathlib import Path
from collections import defaultdict
import math

# 밸브 태그 패턴
VALVE_PATTERNS = {
    'gate': re.compile(r'^VG-?\d+', re.IGNORECASE),
    'check': re.compile(r'^VC-?\d+', re.IGNORECASE),
    'ball': re.compile(r'^VB-?\d+', re.IGNORECASE),
    'line': re.compile(r'^VL-?\d+', re.IGNORECASE),
    'control_flow': re.compile(r'^FCV-?\d+', re.IGNORECASE),
    'control_level': re.compile(r'^LCV-?\d+', re.IGNORECASE),
    'control_temp': re.compile(r'^TCV-?\d+', re.IGNORECASE),
    'control_pressure': re.compile(r'^PCV-?\d+', re.IGNORECASE),
    'safety': re.compile(r'^(PSV|PRV)-?\d+', re.IGNORECASE),
    'hand': re.compile(r'^HV-?\d+', re.IGNORECASE),
    'shutoff': re.compile(r'^XV-?\d+', re.IGNORECASE),
}

# 격리용으로 사용 가능한 밸브 타입
ISOLATION_VALVE_TYPES = ['gate', 'ball', 'shutoff', 'hand']

def get_valve_type(tag):
    """밸브 태그에서 타입 추출"""
    for vtype, pattern in VALVE_PATTERNS.items():
        if pattern.match(tag):
            return vtype
    return 'unknown'

def extract_components(dxf_path):
    """DXF에서 밸브와 라인 추출"""
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    valves = []
    lines = []

    # 텍스트에서 밸브 추출
    for entity in msp.query('TEXT MTEXT'):
        if entity.dxftype() == 'TEXT':
            text = entity.dxf.text.strip().upper().replace(' ', '')
            pos = entity.dxf.insert
        else:  # MTEXT
            text = entity.text.strip().upper().replace(' ', '')
            text = re.sub(r'\\[A-Za-z]+;|\{|\}', '', text)
            pos = entity.dxf.insert

        # 밸브 패턴 체크
        for vtype, pattern in VALVE_PATTERNS.items():
            if pattern.match(text):
                valves.append({
                    'tag': text,
                    'type': vtype,
                    'x': pos.x,
                    'y': pos.y,
                    'can_isolate': vtype in ISOLATION_VALVE_TYPES
                })
                break

    # 라인 추출
    for entity in msp.query('LINE'):
        lines.append({
            'start': (entity.dxf.start.x, entity.dxf.start.y),
            'end': (entity.dxf.end.x, entity.dxf.end.y),
            'layer': entity.dxf.layer
        })

    for entity in msp.query('LWPOLYLINE'):
        points = list(entity.get_points())
        for i in range(len(points) - 1):
            lines.append({
                'start': (points[i][0], points[i][1]),
                'end': (points[i+1][0], points[i+1][1]),
                'layer': entity.dxf.layer
            })

    return valves, lines

def distance(p1, p2):
    """두 점 사이 거리"""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def point_to_line_distance(point, line_start, line_end):
    """점과 선분 사이의 최소 거리"""
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end

    # 선분 길이의 제곱
    line_len_sq = (x2 - x1)**2 + (y2 - y1)**2

    if line_len_sq == 0:
        return distance(point, line_start)

    # 점을 선분에 투영한 위치 (0~1 사이)
    t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / line_len_sq))

    # 투영점
    proj_x = x1 + t * (x2 - x1)
    proj_y = y1 + t * (y2 - y1)

    return distance(point, (proj_x, proj_y))

def build_connection_graph(valves, lines, threshold=30):
    """
    밸브와 라인의 연결 그래프 생성
    """
    # 각 밸브에 연결된 라인 찾기
    valve_lines = defaultdict(list)

    for valve in valves:
        valve_pos = (valve['x'], valve['y'])
        for i, line in enumerate(lines):
            # 밸브가 라인 근처에 있는지 확인
            dist = point_to_line_distance(valve_pos, line['start'], line['end'])
            if dist < threshold:
                valve_lines[valve['tag']].append(i)

    # 같은 라인을 공유하는 밸브들을 연결
    connections = defaultdict(set)

    for v1 in valves:
        for v2 in valves:
            if v1['tag'] == v2['tag']:
                continue

            # 두 밸브가 공유하는 라인이 있는지 확인
            shared_lines = set(valve_lines[v1['tag']]) & set(valve_lines[v2['tag']])
            if shared_lines:
                connections[v1['tag']].add(v2['tag'])

    return connections, valve_lines

def find_nearest_isolation_valves(target_tag, valves, connections, max_depth=3):
    """
    BFS로 가장 가까운 격리 가능 밸브 찾기
    """
    valve_map = {v['tag']: v for v in valves}

    if target_tag not in valve_map:
        return {'error': f'Valve {target_tag} not found'}

    target = valve_map[target_tag]

    # BFS로 연결된 밸브 탐색
    visited = {target_tag}
    queue = [(target_tag, 0, [])]  # (tag, depth, path)

    isolation_candidates = []

    while queue:
        current_tag, depth, path = queue.pop(0)

        if depth > max_depth:
            continue

        for neighbor_tag in connections.get(current_tag, []):
            if neighbor_tag in visited:
                continue

            visited.add(neighbor_tag)
            neighbor = valve_map.get(neighbor_tag)

            if neighbor:
                new_path = path + [current_tag]

                # 격리 가능한 밸브인 경우
                if neighbor.get('can_isolate', False):
                    # 위치 기반으로 방향 판단
                    direction = 'upstream' if neighbor['y'] > target['y'] else 'downstream'

                    isolation_candidates.append({
                        'tag': neighbor_tag,
                        'type': neighbor['type'],
                        'direction': direction,
                        'depth': depth + 1,
                        'path': new_path + [neighbor_tag],
                        'position': {'x': neighbor['x'], 'y': neighbor['y']}
                    })

                queue.append((neighbor_tag, depth + 1, new_path))

    # 방향별로 정렬 (depth 순)
    upstream = sorted([c for c in isolation_candidates if c['direction'] == 'upstream'],
                     key=lambda x: x['depth'])
    downstream = sorted([c for c in isolation_candidates if c['direction'] == 'downstream'],
                       key=lambda x: x['depth'])

    return {
        'target': target_tag,
        'target_type': target.get('type', 'unknown'),
        'target_position': {'x': target['x'], 'y': target['y']},
        'upstream_isolation': upstream[:2],  # 가장 가까운 2개
        'downstream_isolation': downstream[:2],
        'all_connected_valves': list(visited - {target_tag})
    }

def generate_isolation_procedure(isolation_result):
    """격리 절차서 생성"""
    if 'error' in isolation_result:
        return isolation_result

    procedure = {
        'target': isolation_result['target'],
        'steps': []
    }

    step_num = 1

    # Upstream isolation
    for valve in isolation_result['upstream_isolation']:
        procedure['steps'].append({
            'step': step_num,
            'action': 'CLOSE',
            'valve': valve['tag'],
            'type': valve['type'],
            'description_ko': f"상류(전단) {valve['type']} 밸브 {valve['tag']} 폐쇄",
            'description_en': f"Close upstream {valve['type']} valve {valve['tag']}",
            'direction': 'upstream'
        })
        step_num += 1

    # Downstream isolation
    for valve in isolation_result['downstream_isolation']:
        procedure['steps'].append({
            'step': step_num,
            'action': 'CLOSE',
            'valve': valve['tag'],
            'type': valve['type'],
            'description_ko': f"하류(후단) {valve['type']} 밸브 {valve['tag']} 폐쇄",
            'description_en': f"Close downstream {valve['type']} valve {valve['tag']}",
            'direction': 'downstream'
        })
        step_num += 1

    # Drain/Vent (if VL valve exists)
    for valve_tag in isolation_result['all_connected_valves']:
        if valve_tag.startswith('VL-') or valve_tag.startswith('VL'):
            procedure['steps'].append({
                'step': step_num,
                'action': 'OPEN',
                'valve': valve_tag,
                'type': 'drain',
                'description_ko': f"드레인 밸브 {valve_tag} 개방 (잔압 해소)",
                'description_en': f"Open drain valve {valve_tag} (release residual pressure)",
                'direction': 'drain'
            })
            step_num += 1
            break

    # Final verification
    procedure['steps'].append({
        'step': step_num,
        'action': 'VERIFY',
        'description_ko': '압력계 확인 - 잔압 0 확인 후 작업 시작',
        'description_en': 'Check pressure gauge - Verify zero pressure before starting work'
    })

    return procedure

def analyze_drawing(dxf_path, target_valve=None):
    """도면 분석 메인 함수"""
    print(f"\n{'='*60}")
    print(f"도면 분석: {Path(dxf_path).name}")
    print(f"{'='*60}")

    valves, lines = extract_components(dxf_path)
    print(f"발견된 밸브: {len(valves)}개")
    print(f"발견된 라인: {len(lines)}개")

    # 밸브 타입별 통계
    type_counts = defaultdict(int)
    for v in valves:
        type_counts[v['type']] += 1

    print("\nValve types:")
    for vtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        isolatable = '[isolation]' if vtype in ISOLATION_VALVE_TYPES else ''
        print(f"  {vtype}: {count} {isolatable}")

    # 연결 그래프 생성
    connections, valve_lines = build_connection_graph(valves, lines)

    result = {
        'drawing': Path(dxf_path).name,
        'valves': valves,
        'valve_count': len(valves),
        'line_count': len(lines),
        'connections': {k: list(v) for k, v in connections.items()}
    }

    # 특정 밸브 분석
    if target_valve:
        # 대소문자 무시하고 찾기
        found_tag = None
        for v in valves:
            if v['tag'].upper().replace('-', '') == target_valve.upper().replace('-', ''):
                found_tag = v['tag']
                break

        if found_tag:
            isolation = find_nearest_isolation_valves(found_tag, valves, connections)
            procedure = generate_isolation_procedure(isolation)

            print(f"\n{'='*60}")
            print(f"[ISOLATION PROCEDURE] {found_tag}")
            print(f"{'='*60}")

            for step in procedure.get('steps', []):
                action = step.get('action', '')
                valve = step.get('valve', '')
                desc = step.get('description_en', '')

                if action == 'CLOSE':
                    print(f"  {step['step']}. [CLOSE] {valve} - {desc}")
                elif action == 'OPEN':
                    print(f"  {step['step']}. [OPEN] {valve} - {desc}")
                elif action == 'VERIFY':
                    print(f"  {step['step']}. [VERIFY] {desc}")

            result['isolation_analysis'] = isolation
            result['isolation_procedure'] = procedure

    return result

def main():
    dxf_folder = Path(r"C:\Users\USER\OneDrive - GS에너지\바탕 화면\GS 곤 자료\2025년\도면\새 폴더")

    # DH HE Condensate System 도면들 분석
    dxf_files = list(dxf_folder.glob("*DH HE Condensate*.dxf"))

    if not dxf_files:
        print("DXF 파일을 찾을 수 없습니다.")
        return

    all_results = []

    for dxf_path in dxf_files:
        # VC-4307이 있는지 먼저 확인
        result = analyze_drawing(str(dxf_path), target_valve='VC-4307')
        all_results.append(result)

    # 결과 저장
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\isolation_procedures.json")

    # JSON 저장용 데이터 정리
    json_data = []
    for result in all_results:
        clean_result = {
            'drawing': result['drawing'],
            'valve_count': result['valve_count'],
            'line_count': result['line_count']
        }

        if 'isolation_analysis' in result:
            clean_result['isolation_analysis'] = result['isolation_analysis']
        if 'isolation_procedure' in result:
            clean_result['isolation_procedure'] = result['isolation_procedure']

        json_data.append(clean_result)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: {output_path}")

if __name__ == "__main__":
    main()
