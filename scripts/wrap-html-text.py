#!/usr/bin/env python3
"""wrap-html-text.py — wrap only the text content of built HTML files at a
given column width. Every tag, attribute, comment, doctype, and script/style/
code block is reproduced byte-for-byte untouched; only the prose between
tags gets reflowed.

Usage:
  scripts/wrap-html-text.py [--width N] [--preview-dir DIR] <source-dir>

Examples:
  scripts/wrap-html-text.py _site
  scripts/wrap-html-text.py --width 80 _site
  scripts/wrap-html-text.py --preview-dir _site-wrapped-preview _site

Without --preview-dir, files are rewritten in place under <source-dir>.
With --preview-dir, <source-dir> is first copied there and the copy is
rewritten, leaving the original untouched.
"""
import argparse
import os
import shutil
import sys
import textwrap
from html.parser import HTMLParser

# Content of these elements is never touched: code/script/style semantics
# and preformatted whitespace all depend on being preserved verbatim.
NO_WRAP_TAGS = {"script", "style", "pre", "textarea", "title", "code", "kbd", "samp"}


class TextWrapper(HTMLParser):
    def __init__(self, width):
        super().__init__(convert_charrefs=False)
        self.width = width
        self.out = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        self.out.append(self.get_starttag_text())
        if tag.lower() in NO_WRAP_TAGS:
            self.skip_depth += 1

    def handle_startendtag(self, tag, attrs):
        self.out.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        self.out.append("</{0}>".format(tag))
        if tag.lower() in NO_WRAP_TAGS and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.skip_depth > 0 or data.strip() == "":
            self.out.append(data)
            return
        leading = data[: len(data) - len(data.lstrip())]
        trailing = data[len(data.rstrip()):]
        core = data.strip()
        wrapped = textwrap.fill(
            core,
            width=self.width,
            break_long_words=False,
            break_on_hyphens=False,
        )
        self.out.append(leading + wrapped + trailing)

    def handle_comment(self, data):
        self.out.append("<!--{0}-->".format(data))

    def handle_decl(self, decl):
        self.out.append("<!{0}>".format(decl))

    def handle_pi(self, data):
        self.out.append("<?{0}>".format(data))

    def handle_entityref(self, name):
        self.out.append("&{0};".format(name))

    def handle_charref(self, name):
        self.out.append("&#{0};".format(name))

    def unknown_decl(self, data):
        self.out.append("<![{0}]>".format(data))

    def getvalue(self):
        return "".join(self.out)


def process_file(path, width):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    parser = TextWrapper(width)
    parser.feed(html)
    parser.close()
    return parser.getvalue()


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("source_dir")
    ap.add_argument("--width", type=int, default=72)
    ap.add_argument(
        "--preview-dir",
        default=None,
        help="write output here instead of rewriting source_dir in place",
    )
    args = ap.parse_args()

    src = args.source_dir
    if not os.path.isdir(src):
        sys.exit("Error: source directory '{0}' not found.".format(src))

    if args.preview_dir:
        dest_root = args.preview_dir
        shutil.rmtree(dest_root, ignore_errors=True)
        shutil.copytree(src, dest_root)
    else:
        dest_root = src

    count = 0
    skipped = 0
    for root, _dirs, files in os.walk(dest_root):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(root, name)
            try:
                new_html = process_file(path, args.width)
            except Exception as e:
                print("SKIPPED (parse error): {0}: {1}".format(path, e), file=sys.stderr)
                skipped += 1
                continue
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_html)
            count += 1

    print("Wrapped text in {0} HTML file(s) under: {1}".format(count, dest_root))
    if skipped:
        print("{0} file(s) skipped due to parse errors.".format(skipped), file=sys.stderr)


if __name__ == "__main__":
    main()
