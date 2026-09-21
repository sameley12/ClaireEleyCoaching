#!/usr/bin/env python3
"""Static site checks.

Usage: python3 scripts/check.py [--launch] [page.html ...]
Without page arguments all pages are checked. --launch also fails on
unreplaced placeholders such as REPLACE_DOMAIN or [Offer name].
"""
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "privacy.html", "thank-you.html"]
LAUNCH_FILES = PAGES + ["js/main.js", "robots.txt", "sitemap.xml"]
EXTERNAL = ("http://", "https://", "mailto:", "tel:", "javascript:", "//")
PLACEHOLDER = re.compile(r"REPLACE_[A-Z_]+|\[[^\]\n]{2,}\]")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids, self.errors = [], set(), []
        self.h1 = 0
        self.title = False
        self.desc = False
        self.lang = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "html" and a.get("lang"):
            self.lang = True
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self.title = True
        if tag == "meta" and a.get("name") == "description" and a.get("content"):
            self.desc = True
        if tag == "img" and "alt" not in a:
            self.errors.append("img without alt: %s" % a.get("src"))
        for key in ("href", "src"):
            if a.get(key):
                self.refs.append(a[key])


def check_page(name):
    path = ROOT / name
    if not path.exists():
        return ["%s: file is missing" % name]
    page = Page()
    page.feed(path.read_text(encoding="utf-8"))
    errors = ["%s: %s" % (name, e) for e in page.errors]
    if not page.lang:
        errors.append("%s: <html> needs a lang attribute" % name)
    if not page.title:
        errors.append("%s: missing <title>" % name)
    if not page.desc:
        errors.append("%s: missing meta description" % name)
    if page.h1 != 1:
        errors.append("%s: expected exactly one <h1>, found %d" % (name, page.h1))
    for ref in page.refs:
        if ref.startswith(EXTERNAL):
            continue
        if ref.startswith("#"):
            if len(ref) > 1 and ref[1:] not in page.ids:
                errors.append("%s: broken anchor %s" % (name, ref))
            continue
        target = ref.split("#")[0].split("?")[0].lstrip("/")
        if target and not (ROOT / target).exists():
            errors.append("%s: broken link or file %s" % (name, ref))
    return errors


def check_launch():
    errors = []
    for name in LAUNCH_FILES:
        path = ROOT / name
        if path.exists():
            text = re.sub(r"<!--.*?-->", "", path.read_text(encoding="utf-8"), flags=re.DOTALL)
            for hit in sorted(set(PLACEHOLDER.findall(text))):
                errors.append("%s: unreplaced placeholder %s" % (name, hit))
    return errors


def main(argv):
    launch = "--launch" in argv
    pages = [a for a in argv if not a.startswith("--")] or PAGES
    errors = []
    for name in pages:
        errors += check_page(name)
    if launch:
        errors += check_launch()
    for e in errors:
        print("FAIL", e)
    print("%d problem(s)" % len(errors) if errors else "OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
