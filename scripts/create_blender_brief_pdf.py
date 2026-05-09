from pathlib import Path
import textwrap


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Blender_Donation_Tree_Model_Brief.pdf"

SECTIONS = [
    ("Donation Tree 3D Model Brief", [
        "Create one donation tree model exported as a single GLB file for Three.js, React, and Bolt.",
    ]),
    ("File", [
        "File name: donation-tree.glb",
        "Website location: public/models/donation-tree.glb",
    ]),
    ("Scene Setup", [
        "Units: meters",
        "Tree height: about 5 units tall",
        "Tree base centered at world origin",
        "Ground/root base at Y = 0",
        "Tree grows upward along positive Y",
        "Forward direction: -Z",
        "Apply all transforms before export",
        "Model origin should be at the center of the tree base on the ground.",
        "Model bounds should fit roughly X -2.5 to 2.5, Y 0 to 5.5, Z -2.5 to 2.5.",
    ]),
    ("Required Object Names", [
        "TREE_TRUNK",
        "TREE_ROOTS",
        "TREE_CANOPY",
        "PROGRESS_VINE_01",
        "PROGRESS_VINE_02",
        "PROGRESS_VINE_03",
        "Additional donation vines are welcome, but must continue the pattern PROGRESS_VINE_04, PROGRESS_VINE_05, etc.",
        "Every vine that should change color must start with PROGRESS_VINE_.",
    ]),
    ("Vine Behavior", [
        "The vines should physically wrap upward around the tree from the ground toward the canopy.",
        "$0 of $1000 = vines are black",
        "$100 of $1000 = bottom 10% of vines becomes colored",
        "$500 of $1000 = bottom 50% becomes colored",
        "$1000 of $1000 = all vines become colored",
        "The vine geometry needs to rise cleanly along the Y axis. The website code reveals color from low Y to high Y.",
        "Do not create baked animations for donation progress. The website code handles the color reveal.",
    ]),
    ("Materials", [
        "MAT_Trunk_Bark",
        "MAT_Roots_Dark",
        "MAT_Canopy_DarkLeaves",
        "MAT_Vine_Black",
        "The vines can use MAT_Vine_Black in Blender. The website will override progress vine material in code.",
        "Recommended colors: trunk dark brown, roots near black brown, canopy very dark green, vines black or near black.",
    ]),
    ("Geometry Guidelines", [
        "Total triangles: ideally under 80k, max around 120k",
        "No heavy particle systems unless converted to mesh",
        "No procedural nodes that require Blender at runtime",
        "Apply modifiers before export, unless they export reliably to GLB",
        "Use separate mesh objects for trunk, canopy, roots, and progress vines",
        "Use actual tube/mesh geometry for vines, not just curves, unless curves are converted to mesh before export.",
        "Each vine should be one continuous upward path if possible.",
        "Avoid vine parts that go downward for long stretches, because the website reveal is height-based.",
    ]),
    ("Export Settings", [
        "Format: glTF Binary (.glb)",
        "Include: Selected Objects",
        "Transform: default glTF export is fine",
        "Apply Modifiers: Yes",
        "Materials: Export",
        "Animation: Off, unless there are idle ambient animations separate from donation progress",
        "Compression: Draco optional, but not required",
    ]),
    ("Naming Summary", [
        "The website code will look for objects named PROGRESS_VINE_01, PROGRESS_VINE_02, PROGRESS_VINE_03, or any object whose name starts with PROGRESS_VINE_.",
        "Those are the only meshes that should receive the donation-progress color reveal.",
    ]),
]


def pdf_escape(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def add_text_line(lines, x, y, text, size=10, font="F1", leading=14):
    lines.append(f"BT /{font} {size} Tf {x} {y} Td ({pdf_escape(text)}) Tj ET")
    return y - leading


def build_pages():
    pages = []
    lines = []
    y = 760
    margin_x = 54

    def new_page():
        nonlocal lines, y
        if lines:
            pages.append(lines)
        lines = []
        y = 760

    for section_title, items in SECTIONS:
        needed = 28 + len(items) * 18
        if y - needed < 58:
            new_page()

        if section_title == "Donation Tree 3D Model Brief":
            y = add_text_line(lines, margin_x, y, section_title, size=21, font="F2", leading=28)
        else:
            y -= 6
            y = add_text_line(lines, margin_x, y, section_title, size=13, font="F2", leading=18)

        for item in items:
            wrapped = textwrap.wrap(item, width=88)
            for index, part in enumerate(wrapped):
                prefix = "- " if index == 0 and section_title != "Donation Tree 3D Model Brief" else "  "
                if section_title == "Donation Tree 3D Model Brief":
                    prefix = ""
                y = add_text_line(lines, margin_x, y, prefix + part, size=10.4, font="F1", leading=14.5)
            if len(wrapped) > 1:
                y -= 1
        y -= 7

    if lines:
        pages.append(lines)
    return pages


def make_pdf():
    pages = build_pages()
    objects = []

    def obj(data):
        objects.append(data)
        return len(objects)

    catalog_id = obj("<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = obj("")
    font_regular_id = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold_id = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    page_ids = []
    for page_lines in pages:
        stream = "\n".join(page_lines)
        stream_obj_id = obj(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}\nendstream")
        page_id = obj(
            "<< /Type /Page "
            f"/Parent {pages_id} 0 R "
            "/MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_regular_id} 0 R /F2 {font_bold_id} 0 R >> >> "
            f"/Contents {stream_obj_id} 0 R >>"
        )
        page_ids.append(page_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>"
    objects[catalog_id - 1] = "<< /Type /Catalog /Pages 2 0 R >>"

    body = ["%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    offsets = [0]
    current = len(body[0].encode("latin-1"))
    for index, data in enumerate(objects, start=1):
        entry = f"{index} 0 obj\n{data}\nendobj\n"
        offsets.append(current)
        body.append(entry)
        current += len(entry.encode("latin-1"))

    xref_offset = current
    xref = [f"xref\n0 {len(objects) + 1}\n", "0000000000 65535 f \n"]
    for offset in offsets[1:]:
        xref.append(f"{offset:010d} 00000 n \n")
    trailer = (
        "trailer\n"
        f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        "startxref\n"
        f"{xref_offset}\n"
        "%%EOF\n"
    )

    OUT.write_bytes("".join(body + xref + [trailer]).encode("latin-1"))
    print(OUT)


if __name__ == "__main__":
    make_pdf()
