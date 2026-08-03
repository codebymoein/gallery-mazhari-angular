import argparse, json, shutil, sqlite3
from datetime import datetime
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--db',required=True,type=Path); p.add_argument('--data',required=True,type=Path)
p.add_argument('--backup-dir',required=True,type=Path); p.add_argument('--commit',action='store_true')
a=p.parse_args(); rows=json.loads(a.data.read_text(encoding='utf-8'))
c=sqlite3.connect(a.db); c.row_factory=sqlite3.Row
found=[]
for item in rows:
 r=c.execute('select id,code,description,enrichment from staging_products where upper(code)=upper(?)',(item['code'],)).fetchone()
 if not r: raise SystemExit(f"Missing product code: {item['code']}")
 if (r['description'] or '').strip(): raise SystemExit(f"Description already exists: {item['code']}")
 found.append((r,item))
report={'requested':len(rows),'matched':len(found),'committed':a.commit}
if a.commit:
 a.backup_dir.mkdir(parents=True,exist_ok=True)
 backup=a.backup_dir/f"gallery-mazhari-before-image-descriptions-small-{datetime.now():%Y-%m-%d-%H%M%S}.sqlite"
 c.commit(); shutil.copy2(a.db,backup)
 for r,item in found:
  enrichment=json.loads(r['enrichment'] or '{}')
  enrichment['additionalDescription']=item['full']
  enrichment['descriptionSource']='manual_image_review'
  enrichment['descriptionReviewedAt']=datetime.now().isoformat()
  c.execute("update staging_products set description=?,enrichment=?,updatedAt=datetime('now') where id=?",(item['short'],json.dumps(enrichment,ensure_ascii=False),r['id']))
 c.commit(); report['backup']=str(backup)
print(json.dumps(report,ensure_ascii=True))
