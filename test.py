"""
Loom Indica - Saree Excel to MySQL Importer
============================================
Usage:
    pip install pandas openpyxl mysql-connector-python

    # Import a single file:
    python import_sarees.py BAGRU_COTTON_SAREE.xlsx

    # Import all Excel files in a folder:
    python import_sarees.py --folder ./saree_files/

How it works:
    1. Reads each Excel file (skips blank row 0, uses row 1 as header)
    2. Resolves category hierarchy from the Excel columns
       (CATEGORY > SUB CATEGORY > SUB CATEGORY 2 > SUB CATEGORY 3)
    3. Creates missing categories automatically (no image, is_active=1)
    4. Inserts products, product_variants, and product_attributes
    5. Skips duplicate products (matched by SKU) so re-running is safe
"""

import sys
import os
import re
import glob
import argparse
from datetime import datetime

import pandas as pd
import mysql.connector

# ─────────────────────────────────────────────
# DB CONNECTION — change only if needed
# ─────────────────────────────────────────────
DB_CONFIG = {
      "host": "34.231.15.242",
    "port": 51526,
    "database": "loomindica",
    "user": "admin",
    "password": "Web#Sage#04",
    "ssl_disabled": True
}

# ─────────────────────────────────────────────
# COLUMN MAPPING
# Both Excel files have slightly different column names,
# so we normalise them here.
# ─────────────────────────────────────────────
COL_MAP = {
    # normalised key : list of possible raw column names (case-insensitive)
    "s_no":           ["s no.", "s no"],
    "sku":            ["sku"],
    "name":           ["name"],
    "category":       ["category", "category "],
    "sub_cat1":       ["sub category", "sub category ", "subcategory"],
    "sub_cat2":       ["sub category 2"],
    "sub_cat3":       ["sub category 3", "subcategory 3"],
    "colour":         ["colour", "color"],
    "dye_pattern":    ["dye", "pattern"],
    "short_desc":     ["short description"],
    "brand":          ["brand"],
    "hsn_code":       ["hsn code"],
    "tax_rate":       ["tax rate", "tax rate "],
    "status":         ["status"],
    "attr_name1":     ["attribute name 1 (ex:fabric)", "attribute  name 1 (ex:fabric)",
                       "attribute name 1 (ex:fabric)"],
    "attr_value1":    ["attribute value 1 (ex:fabric)", "attribute  name 1 (ex:cotton)",
                       "attribute value 1 (ex:fabric)"],
    "blouse":         ["attribuute name"],   # always "WITH ATTACHED BLOUSE PIECE"
    "length":         ["length"],
    "width":          ["width"],
    "blouse_piece_len": ["blouse piece lngth"],
    "unit_type":      ["unit type"],
    "price":          ["mrp / price", "mrp / price "],
    "dis_rate":       ["dis. rate"],
    "sale_price":     ["sale price (leave blank if no offer)",
                       "sale price (leave blank if no offer) "],
    "stock_qty":      ["stock qty", "stock qty "],
    "min_order_qty":  ["min order qty"],
    "max_order_qty":  ["max order qty"],
    "weight":         ["weight (g)", "weight(g)"],
    "length_per_piece": ["length per piece(m)", "length pre piece (m)"],
    "collection":     ["drive folder"],
    "wash_care":      ["wash care"],
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    return text


def normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename raw columns to normalised keys."""
    rename = {}
    lower_cols = {c.lower().strip(): c for c in df.columns}
    for norm_key, candidates in COL_MAP.items():
        for cand in candidates:
            if cand.lower().strip() in lower_cols:
                rename[lower_cols[cand.lower().strip()]] = norm_key
                break
    return df.rename(columns=rename)


def val(row, key, default=None):
    """Safely get a value from a row, returning default if missing/NaN."""
    v = row.get(key, default)
    if pd.isna(v) if not isinstance(v, str) else False:
        return default
    if isinstance(v, str):
        v = v.strip()
        return v if v else default
    return v


# ─────────────────────────────────────────────
# CATEGORY HELPERS
# ─────────────────────────────────────────────

def get_or_create_category(cursor, name: str, parent_id, category_cache: dict) -> int:
    """Return category id, creating it if it doesn't exist."""
    cache_key = (name.lower(), parent_id)
    if cache_key in category_cache:
        return category_cache[cache_key]

    cursor.execute(
        "SELECT id FROM categories WHERE LOWER(name)=%s AND (parent_id=%s OR (parent_id IS NULL AND %s IS NULL))",
        (name.lower(), parent_id, parent_id)
    )
    row = cursor.fetchone()
    if row:
        category_cache[cache_key] = row[0]
        return row[0]

    slug = slugify(name)
    # make slug unique if collision
    cursor.execute("SELECT COUNT(*) FROM categories WHERE slug=%s", (slug,))
    count = cursor.fetchone()[0]
    if count > 0:
        slug = f"{slug}-{count}"

    cursor.execute(
        """INSERT INTO categories (name, slug, image_url, description, is_active, is_deleted, created_at, parent_id)
           VALUES (%s, %s, %s, %s, 1, 0, %s, %s)""",
        (name, slug, None, None, datetime.now(), parent_id)
    )
    new_id = cursor.lastrowid
    category_cache[cache_key] = new_id
    print(f"  [CATEGORY CREATED] {name!r} (id={new_id}, parent_id={parent_id})")
    return new_id


def resolve_category(cursor, row, category_cache: dict):
    """
    Walk CATEGORY > SUB CATEGORY > SUB CATEGORY 2 > SUB CATEGORY 3
    Return (category_id, ancestor_ids_str, depth, full_path, full_slug, slug_path)
    """
    levels = []
    for key in ["category", "sub_cat1", "sub_cat2", "sub_cat3"]:
        v = val(row, key)
        if v:
            levels.append(v.title())

    if not levels:
        raise ValueError("No category information found in row")

    parent_id = None
    ids = []
    for name in levels:
        cat_id = get_or_create_category(cursor, name, parent_id, category_cache)
        ids.append(cat_id)
        parent_id = cat_id

    leaf_id = ids[-1]
    ancestor_ids = ",".join(str(i) for i in ids[:-1])
    depth = len(ids)
    full_path = " > ".join(levels)
    full_slug = "/".join(slugify(l) for l in levels)
    slug_path = str([slugify(l) for l in levels])

    return leaf_id, ancestor_ids, depth, full_path, full_slug, slug_path


# ─────────────────────────────────────────────
# SKU EXISTS CHECK
# ─────────────────────────────────────────────

def sku_exists(cursor, sku: str) -> bool:
    cursor.execute("SELECT id FROM product_varients WHERE sku=%s", (sku,))
    return cursor.fetchone() is not None


# ─────────────────────────────────────────────
# MAIN INSERT LOGIC
# ─────────────────────────────────────────────

def insert_row(cursor, row, category_cache: dict, stats: dict):
    sku_raw = val(row, "sku", "")
    sku = " ".join(str(sku_raw).split())  # normalise spaces

    if not sku:
        stats["skipped_no_sku"] += 1
        return

    if sku_exists(cursor, sku):
        stats["skipped_duplicate"] += 1
        print(f"  [SKIP] SKU already exists: {sku!r}")
        return

    # ── category ──────────────────────────────
    try:
        cat_id, ancestor_ids, depth, full_path, full_slug, slug_path = \
            resolve_category(cursor, row, category_cache)
    except Exception as e:
        print(f"  [SKIP] Category error for SKU {sku!r}: {e}")
        stats["skipped_error"] += 1
        return

    # ── product name ──────────────────────────
    name_raw = val(row, "name", "")
    colour   = val(row, "colour", "")
    dye_pat  = val(row, "dye_pattern", "")
    name = " ".join(str(name_raw).split())
    if colour and colour.upper() not in ("SOLD",):
        name = f"{name} - {colour.title()}"

    slug = slugify(name)
    # uniquify slug
    cursor.execute("SELECT COUNT(*) FROM products WHERE slug LIKE %s", (f"{slug}%",))
    cnt = cursor.fetchone()[0]
    if cnt > 0:
        slug = f"{slug}-{cnt + 1}"

    brand    = val(row, "brand", "LOOMINDICA")
    hsn      = val(row, "hsn_code")
    tax      = val(row, "tax_rate", 0.05)
    short_d  = val(row, "short_desc", "")
    status   = str(val(row, "status", "AVAILABLE")).upper()
    is_active = 0 if status in ("SOLD", "INACTIVE") else 1

    # product_type = leaf category name (e.g. BAGRU, BENGAL COTTON)
    sub3 = val(row, "sub_cat3")
    sub2 = val(row, "sub_cat2")
    product_type = (sub3 or sub2 or val(row, "sub_cat1", "")).upper()

    category_slug_col = full_slug  # alias to match existing column name

    cursor.execute(
        """INSERT INTO products
           (name, slug, short_description, description, product_type, brand, hsn_code,
            tax_rate, is_active, created_at, updated_at, is_deleted,
            category_id, category_ancestor_ids, category_depth,
            category_full_path, category_full_slug, category_slug_path)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0,%s,%s,%s,%s,%s,%s)""",
        (
            name, slug, short_d, short_d, product_type, brand,
            str(hsn) if hsn else None,
            float(tax) if tax else 0.05,
            is_active,
            datetime.now(), datetime.now(),
            cat_id, ancestor_ids, depth,
            full_path, full_slug, slug_path,
        )
    )
    product_id = cursor.lastrowid

    # ── product_attributes ────────────────────
    attrs = []

    # attr 1 (Fabric Type / Saree)
    a1_name  = val(row, "attr_name1", "Fabric Type")
    a1_value = val(row, "attr_value1", "Saree")
    if a1_name and a1_value:
        attrs.append((a1_name.title(), a1_value.title()))

    attrs.append(("Material", "Cotton"))

    blouse = val(row, "blouse", "With Attached Blouse Piece")
    if blouse:
        attrs.append(("Blouse", blouse.title()))

    if colour and colour.upper() not in ("SOLD",):
        attrs.append(("Colour", colour.title()))

    if dye_pat:
        # column is DYE in Bagru, PATTERN in Bangal — store as-is with a smart name
        attr_label = "Pattern" if "pattern" in str(dye_pat).lower() or any(
            w in str(dye_pat).lower() for w in ["motif", "check", "colour", "pallo", "woven", "solid"]
        ) else "Dye"
        attrs.append((attr_label, dye_pat.title()))

    length = val(row, "length")
    if length:
        attrs.append(("Length", str(length).title()))

    width = val(row, "width")
    if width:
        attrs.append(("Width", str(width).title()))

    bpl = val(row, "blouse_piece_len")
    if bpl:
        attrs.append(("Blouse Piece Length", str(bpl).title()))

    wash = val(row, "wash_care")
    if wash:
        attrs.append(("Wash Care", wash.title()))

    collection = val(row, "collection")
    if collection and str(collection).upper() not in ("SOLD", "NAN", ""):
        attrs.append(("Collection", str(collection).title()))

    for aname, avalue in attrs:
        cursor.execute(
            "INSERT INTO product_attributes (attribute_name, attribute_value, product_id) VALUES (%s,%s,%s)",
            (aname, avalue, product_id)
        )

    # ── product_varients ──────────────────────
    price     = val(row, "price", 0)
    sale_price = val(row, "sale_price")
    stock_qty = val(row, "stock_qty", 1)
    min_qty   = val(row, "min_order_qty", 1)
    max_qty   = val(row, "max_order_qty")
    weight    = val(row, "weight")
    lpp       = val(row, "length_per_piece")
    unit_type = val(row, "unit_type", "piece")

    variant_name = f"{colour.title() if colour else 'Default'}"
    if dye_pat:
        variant_name += f" - {dye_pat.title()}"

    low_stock = 2
    v_is_active = 0 if status in ("SOLD", "INACTIVE") else 1

    cursor.execute(
        """INSERT INTO product_varients
           (sku, variant_name, color, size, price, sale_price, stock_quantity,
            unit_type, min_order_qty, max_order_qty, length_per_piece,
            weight, barcode, low_stock_threshold, is_active, created_at, product_id)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (
            sku,
            variant_name,
            colour.title() if colour else None,
            None,   # size not in Excel
            float(price) if price else 0,
            float(sale_price) if sale_price else None,
            float(stock_qty) if stock_qty is not None else 1,
            (unit_type or "piece").lower(),
            float(min_qty) if min_qty else 1,
            float(max_qty) if max_qty else None,
            float(lpp) if lpp else None,
            float(weight) if weight else None,
            None,   # barcode not in Excel
            low_stock,
            v_is_active,
            datetime.now(),
            product_id,
        )
    )

    stats["inserted"] += 1
    print(f"  [OK] SKU={sku!r}  Product={name!r}  Category={full_path!r}")


# ─────────────────────────────────────────────
# FILE PROCESSOR
# ─────────────────────────────────────────────

def process_file(filepath: str, cursor, category_cache: dict):
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(filepath)}")
    print(f"{'='*60}")

    xl = pd.read_excel(filepath, sheet_name=None, header=0)
    sheet_name = list(xl.keys())[0]
    df = xl[sheet_name]

    # The actual header is in row 0 (index 0), data starts row 1
    # But read_excel with header=0 already puts row 0 as header
    # Drop any completely blank rows
    df = df.dropna(how="all")

    # If first column looks like a header row (contains 'S NO'), re-read with header=0
    # Check if data row 0 is actually the header row
    first_val = str(df.iloc[0, 0]).lower().strip() if len(df) > 0 else ""
    if "s no" in first_val or first_val in ("", "nan"):
        # First row is header, skip it
        df.columns = df.iloc[0]
        df = df[1:].reset_index(drop=True)
        df = df.dropna(how="all")

    df = normalise_columns(df)

    stats = {"inserted": 0, "skipped_duplicate": 0, "skipped_no_sku": 0, "skipped_error": 0}

    for _, row in df.iterrows():
        # Skip if S NO is blank (blank spacer rows)
        s_no = row.get("s_no", None)
        if pd.isna(s_no) if not isinstance(s_no, str) else s_no.strip() == "":
            continue
        try:
            insert_row(cursor, row, category_cache, stats)
        except Exception as e:
            sku = val(row, "sku", "?")
            print(f"  [ERROR] SKU={sku!r}: {e}")
            stats["skipped_error"] += 1

    print(f"\n  Summary: inserted={stats['inserted']}, "
          f"skipped_duplicate={stats['skipped_duplicate']}, "
          f"skipped_error={stats['skipped_error']}, "
          f"skipped_no_sku={stats['skipped_no_sku']}")
    return stats


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import saree Excel files into MySQL")
    parser.add_argument("files", nargs="*", help="Excel file(s) to import")
    parser.add_argument("--folder", help="Import all .xlsx files in this folder")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse files and show what would be inserted, without touching DB")
    args = parser.parse_args()

    files = list(args.files)
    if args.folder:
        files += glob.glob(os.path.join(args.folder, "*.xlsx"))

    if not files:
        print("Error: provide at least one .xlsx file or use --folder")
        sys.exit(1)

    if args.dry_run:
        print("DRY RUN — no DB changes will be made\n")
        for f in files:
            xl = pd.read_excel(f, sheet_name=None, header=0)
            df = list(xl.values())[0].dropna(how="all")
            df = normalise_columns(df)
            print(f"{os.path.basename(f)}: {len(df)} rows, columns: {list(df.columns)}")
        return

    conn = mysql.connector.connect(**DB_CONFIG)
    conn.autocommit = False
    cursor = conn.cursor()

    category_cache = {}  # (name_lower, parent_id) -> id
    total_inserted = 0

    try:
        for filepath in files:
            if not os.path.exists(filepath):
                print(f"[WARNING] File not found: {filepath}")
                continue
            stats = process_file(filepath, cursor, category_cache)
            total_inserted += stats["inserted"]

        conn.commit()
        print(f"\n{'='*60}")
        print(f"DONE — Total rows inserted: {total_inserted}")
        print(f"{'='*60}")

    except Exception as e:
        conn.rollback()
        print(f"\n[FATAL ERROR] Rolling back all changes: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()