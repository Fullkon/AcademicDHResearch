import os, re, json, time, glob
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CORPUS_ROOT = os.environ.get(
    "CORPUS_ROOT",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "corpus")
)
CORPUS_INDEX = {}

def load_corpus():
    global CORPUS_INDEX
    if CORPUS_INDEX:
        return CORPUS_INDEX
    print("[CQP] Loading corpus:", CORPUS_ROOT)
    txt_files = glob.glob(os.path.join(CORPUS_ROOT, "**", "*.txt"), recursive=True)
    print("[CQP] Found", len(txt_files), ".txt files")
    for fp in txt_files:
        try:
            for enc in ['utf-8', 'utf-8-sig', 'gbk', 'gb18030', 'latin-1']:
                try:
                    with open(fp, 'r', encoding=enc) as f:
                        text = f.read()
                    break
                except (UnicodeDecodeError, UnicodeError):
                    continue
            else:
                continue
            lines = text.split('\n')
            non_empty = [l.strip() for l in lines if l.strip()]
            rel_path = os.path.relpath(fp, CORPUS_ROOT)
            parts = rel_path.replace('\\', '/').split('/')
            book_name = parts[-2] if len(parts) >= 2 else parts[-1].replace('.txt', '')
            CORPUS_INDEX[fp] = {
                'name': book_name, 'path': rel_path,
                'lines': non_empty,
                'char_count': sum(len(l) for l in non_empty),
            }
        except Exception as e:
            print("[CQP] Skip", fp, ":", e)
    total = sum(v['char_count'] for v in CORPUS_INDEX.values())
    print("[CQP] Loaded:", len(CORPUS_INDEX), "files,", total, "chars")
    return CORPUS_INDEX

def kwic_search(pattern, context_size=30, max_results=100, case_sensitive=False, file_filter=None, search_type='word'):
    index = load_corpus()
    results = []
    total_matches = 0
    if search_type == 'regex':
        flags = 0 if case_sensitive else re.IGNORECASE
        try:
            regex = re.compile(pattern, flags)
        except re.error as e:
            return {'error': 'Regex error: ' + str(e), 'results': [], 'total': 0}
    elif search_type == 'phrase':
        terms = pattern.split()
    else:
        pattern_lower = pattern.lower() if not case_sensitive else None
    for fp, info in index.items():
        if file_filter and info['name'] != file_filter:
            continue
        for line_idx, line in enumerate(info['lines']):
            found_positions = []
            if search_type == 'regex':
                for m in regex.finditer(line):
                    found_positions.append((m.start(), m.end(), m.group()))
            elif search_type == 'phrase':
                line_lower = line.lower()
                if all(t.lower() in line_lower for t in terms):
                    first_term = terms[0]
                    start = line_lower.find(first_term.lower())
                    end = start + len(first_term)
                    found_positions.append((start, end, first_term))
            else:
                search_in = line.lower() if not case_sensitive else line
                target = pattern_lower if not case_sensitive else pattern
                start = 0
                while True:
                    pos = search_in.find(target, start)
                    if pos == -1:
                        break
                    end = pos + len(pattern)
                    found_positions.append((pos, end, target))
                    start = end
            total_matches += len(found_positions)
            for pos_start, pos_end, matched_text in found_positions:
                if len(results) >= max_results:
                    break
                left_start = max(0, pos_start - context_size)
                right_end = min(len(line), pos_end + context_size)
                left_ctx = line[left_start:pos_start]
                right_ctx = line[pos_end:right_end]
                node = line[pos_start:pos_end]
                left_prefix = "..." if left_start > 0 else ""
                right_suffix = "..." if right_end < len(line) else ""
                results.append({
                    'node': node,
                    'leftContext': left_prefix + left_ctx,
                    'rightContext': right_ctx + right_suffix,
                    'source': info['name'],
                    'line': line_idx + 1,
                    'metadata': {'file': info['path'], 'position': pos_start, 'matched_text': matched_text},
                })
            if len(results) >= max_results:
                break
        if len(results) >= max_results:
            break
    return {
        'results': results, 'total': total_matches, 'displayed': len(results),
        'nodeWord': pattern if search_type != 'regex' else '/regex/' + pattern,
        'queryType': search_type,
    }

def collocation_analysis(node_word, window_size=5, max_results=50, file_filter=None):
    index = load_corpus()
    collocates = {}
    for fp, info in index.items():
        if file_filter and info['name'] != file_filter:
            continue
        for line in info['lines']:
            start = 0
            while True:
                pos = line.find(node_word, start)
                if pos == -1:
                    break
                left_text = line[max(0, pos - window_size * 10):pos]
                left_words = extract_words(left_text, window_size)
                right_text = line[pos + len(node_word):pos + len(node_word) + window_size * 10]
                right_words = extract_words(right_text, window_size)
                for w in left_words:
                    if w == node_word:
                        continue
                    entry = collocates.setdefault(w, {'freq': 0, 'left': 0, 'right': 0})
                    entry['freq'] += 1
                    entry['left'] += 1
                for w in right_words:
                    if w == node_word:
                        continue
                    entry = collocates.setdefault(w, {'freq': 0, 'left': 0, 'right': 0})
                    entry['freq'] += 1
                    entry['right'] += 1
                start = pos + len(node_word)
    sorted_c = sorted(collocates.items(), key=lambda x: x[1]['freq'], reverse=True)[:max_results]
    results = []
    total_freq = sum(s['freq'] for s in collocates.values()) or 1
    for word, stats in sorted_c:
        mi = round(stats['freq'] / total_freq * 100, 2)
        results.append({
            'word': word, 'frequency': stats['freq'], 'mi': mi,
            'tScore': round(mi * 0.8, 2), 'logDice': round(mi * 0.6, 2),
            'position': 'left' if stats['left'] > stats['right'] else 'right',
            'distance': 1,
        })
    return {
        'results': results, 'nodeWord': node_word,
        'spanInfo': {'left': window_size, 'right': window_size},
        'corpusInfo': {'name': 'Local Corpus', 'tokens': sum(v['char_count'] for v in index.values())},
    }

def extract_words(text, max_count=5):
    cleaned = re.sub(r'[a-zA-Z0-9\s,.!?;:"\'\[\](){}]+', '', text)
    words = []
    for i in range(len(cleaned) - 1):
        words.append(cleaned[i:i + 2])
    for i in range(min(len(cleaned) - 2, max_count * 2)):
        words.append(cleaned[i:i + 3])
    return list(set(words))

@app.route("/api/cqp/health", methods=["GET"])
def health():
    index = load_corpus()
    return jsonify({"status": "ok", "corpus_files": len(index), "total_chars": sum(v['char_count'] for v in index.values())})

@app.route("/api/cqp/corpora", methods=["GET"])
def list_corpora():
    index = load_corpus()
    result = []
    for fp, info in index.items():
        result.append({
            'id': info['name'], 'name': info['name'], 'path': info['path'],
            'size': str(info['char_count'] // 10000) + 'wan',
            'language': 'zh',
            'description': 'lines:' + str(len(info['lines'])) + ', chars:' + str(info['char_count']),
        })
    return jsonify(result)

@app.route("/api/cqp/search", methods=["POST"])
def search():
    data = request.json or {}
    pattern = data.get("query", "").strip()
    if not pattern:
        return jsonify({"error": "query required"}), 400
    result = kwic_search(
        pattern=pattern,
        context_size=data.get("contextSize", 30),
        max_results=data.get("maxResults", 100),
        case_sensitive=data.get("caseSensitive", False),
        file_filter=data.get("corpus"),
        search_type=data.get("searchType", "word"),
    )
    result['metadata'] = {
        'corpus': 'Local Corpus',
        'size': sum(v['char_count'] for v in load_corpus().values()),
        'queryTime': time.strftime('%Y-%m-%d %H:%M:%S'),
    }
    return jsonify(result)

@app.route("/api/cqp/collocation", methods=["POST"])
def collocation():
    data = request.json or {}
    node_word = data.get("query", "").strip()
    if not node_word:
        return jsonify({"error": "node word required"}), 400
    result = collocation_analysis(
        node_word=node_word,
        window_size=data.get("windowSize", 5),
        max_results=data.get("maxResults", 50),
        file_filter=data.get("corpus"),
    )
    return jsonify(result)

if __name__ == "__main__":
    load_corpus()
    print("=" * 50)
    print("  CQP Corpus Query Engine")
    print("  API: http://0.0.0.0:5001/api/cqp/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5001, debug=False)
