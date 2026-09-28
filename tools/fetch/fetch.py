"""Fetch images for the site on GitHub's runners (used when the editing
environment cannot reach image hosts). Reads tools/fetch/jobs.json and writes
everything to ./out, which the workflow commits to a temporary branch."""
import json, os, time, urllib.parse, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (souls-by-zamani asset fetch)", "Accept": "application/json"}

def get(url, binary=False):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except Exception as e:
            print("retry", url, e); time.sleep(2 + attempt * 3)
    return None

jobs = json.load(open("tools/fetch/jobs.json"))
os.makedirs("out", exist_ok=True)
for item in jobs.get("urls", []):
    data = get(item["url"], binary=True)
    if data:
        path = os.path.join("out", item["out"]); os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "wb").write(data); print("saved", path, len(data))
for s in jobs.get("search", []):
    q = urllib.parse.quote(s["q"])
    res = get(f"https://unsplash.com/napi/search/photos?query={q}&per_page={s.get('n', 12)}")
    if not res:
        print("search failed", s); continue
    keep = []
    for p in res.get("results", []):
        if p.get("premium") or p.get("plus") or "plus.unsplash.com" in p["urls"]["raw"]:
            continue
        keep.append({"id": p["id"], "raw": p["urls"]["raw"], "desc": p.get("alt_description") or "",
                     "author": p["user"]["name"], "profile": p["user"]["links"]["html"], "page": p["links"]["html"]})
    d = os.path.join("out", "search", s["key"]); os.makedirs(d, exist_ok=True)
    json.dump(keep, open(os.path.join(d, "meta.json"), "w"), indent=1)
    for p in keep:
        img = get(p["raw"] + "&w=" + str(s.get("w", 360)) + "&q=70&fm=jpg", binary=True)
        if img: open(os.path.join(d, p["id"] + ".jpg"), "wb").write(img)
    print(s["key"], len(keep))
for p in jobs.get("photos", []):
    img = get(p["raw"] + "&w=1400&q=85&fm=jpg", binary=True)
    if img:
        os.makedirs("out/photos", exist_ok=True); open(f"out/photos/{p['id']}.jpg", "wb").write(img); print("photo", p["id"])
