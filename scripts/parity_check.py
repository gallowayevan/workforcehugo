"""Content-parity check between two Hugo builds.

Guards against content corruption during template/CSS work (redesigns,
Hugo upgrades): article prose, links, and images inside the content
region of every page must be identical between builds unless a page is
explicitly whitelisted as intentionally changed.

Usage:
    python scripts/parity_check.py <baseline_dir> <candidate_dir> [--expect-changed rel1,rel2,...]

The content region is the first <article> element, falling back to the
#main-content container. Comparison is on whitespace-normalized visible
text plus the sets of link hrefs and image srcs within the region.

Exit code 0 = parity holds (all diffs whitelisted); 1 = unexpected diffs.
"""
import sys
import os
import argparse
from html.parser import HTMLParser


class RegionExtractor(HTMLParser):
    """Extract visible text, hrefs, and img srcs from the content region."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.region_depth = 0        # nesting inside the chosen region
        self.region_kind = None      # 'article' or 'main'
        self.done = False
        self.skip = 0                # inside script/style
        self.texts = []
        self.links = []
        self.imgs = []
        self._stack = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if not self.done and self.region_depth == 0:
            if tag == "article":
                self.region_kind = "article"
                self.region_depth = 1
                self._stack = [tag]
                return
            if tag == "div" and a.get("id") == "main-content" and self.region_kind is None:
                self.region_kind = "main"
                self.region_depth = 1
                self._stack = [tag]
                return
        elif self.region_depth > 0:
            self._stack.append(tag)
            self.region_depth += 1 if tag not in ("br", "img", "hr", "meta", "link", "input") else 0
            if tag in ("script", "style"):
                self.skip += 1
            if tag == "a" and "href" in a:
                self.links.append(a["href"])
            if tag == "img":
                self.imgs.append(a.get("src", ""))

    def handle_endtag(self, tag):
        if self.region_depth > 0:
            if tag in ("script", "style") and self.skip > 0:
                self.skip -= 1
            if tag not in ("br", "img", "hr", "meta", "link", "input"):
                self.region_depth -= 1
                if self.region_depth == 0:
                    # Prefer the first <article>; a main-content region is
                    # only kept if no article was ever found.
                    if self.region_kind == "article":
                        self.done = True

    def handle_data(self, data):
        if self.region_depth > 0 and not self.skip:
            self.texts.append(data)


def extract(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        html = f.read()
    # First pass: prefer <article>
    p = RegionExtractor()
    p.feed(html)
    if p.region_kind is None:
        return None
    text = " ".join("".join(p.texts).split())
    return {"text": text, "links": sorted(set(p.links)), "imgs": sorted(set(p.imgs))}


def collect(root):
    pages = {}
    for dirpath, _dirnames, filenames in os.walk(root):
        if "index.html" in filenames:
            rel = os.path.relpath(dirpath, root).replace("\\", "/")
            rel = "" if rel == "." else rel
            pages[rel] = os.path.join(dirpath, "index.html")
    return pages


def word_diff_preview(a, b, context=8):
    aw, bw = a.split(), b.split()
    i = 0
    while i < min(len(aw), len(bw)) and aw[i] == bw[i]:
        i += 1
    j = 0
    while j < min(len(aw), len(bw)) - i and aw[-1 - j] == bw[-1 - j]:
        j += 1
    a_mid = " ".join(aw[max(0, i - context): len(aw) - j + context])
    b_mid = " ".join(bw[max(0, i - context): len(bw) - j + context])
    return a_mid[:220], b_mid[:220]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline")
    ap.add_argument("candidate")
    ap.add_argument("--expect-changed", default="",
                    help="comma-separated relative page dirs allowed to differ")
    args = ap.parse_args()

    expected = {p.strip().strip("/") for p in args.expect_changed.split(",") if p.strip()}

    base_pages = collect(args.baseline)
    cand_pages = collect(args.candidate)

    problems = []
    notes = []

    missing = sorted(set(base_pages) - set(cand_pages))
    added = sorted(set(cand_pages) - set(base_pages))
    for m in missing:
        problems.append(f"PAGE MISSING in candidate: /{m}/")
    for a in added:
        notes.append(f"page added in candidate: /{a}/")

    same = unexpected = allowed = skipped = 0
    for rel in sorted(set(base_pages) & set(cand_pages)):
        b = extract(base_pages[rel])
        c = extract(cand_pages[rel])
        if b is None or c is None:
            skipped += 1
            notes.append(f"no content region found, skipped: /{rel}/")
            continue
        diffs = []
        if b["text"] != c["text"]:
            was, now = word_diff_preview(b["text"], c["text"])
            diffs.append(f"text differs\n      was: ...{was}...\n      now: ...{now}...")
        if b["links"] != c["links"]:
            lost = set(b["links"]) - set(c["links"])
            gained = set(c["links"]) - set(b["links"])
            diffs.append(f"links differ (lost: {sorted(lost)[:5]}, gained: {sorted(gained)[:5]})")
        if b["imgs"] != c["imgs"]:
            lost = set(b["imgs"]) - set(c["imgs"])
            gained = set(c["imgs"]) - set(b["imgs"])
            diffs.append(f"images differ (lost: {sorted(lost)[:5]}, gained: {sorted(gained)[:5]})")
        if not diffs:
            same += 1
        elif rel.strip("/") in expected:
            allowed += 1
        else:
            unexpected += 1
            problems.append(f"UNEXPECTED DIFF at /{rel}/:\n    " + "\n    ".join(diffs))

    print(f"pages compared: {same + allowed + unexpected}  identical: {same}  "
          f"allowed-changed: {allowed}  unexpected: {unexpected}  skipped: {skipped}")
    for n in notes:
        print(f"  note: {n}")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("PARITY OK")
    sys.exit(0)


if __name__ == "__main__":
    main()
