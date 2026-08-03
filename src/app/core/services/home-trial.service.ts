import { Injectable, signal } from '@angular/core';
import { BridalSampleProduct, getBridalProductById } from '@shared/data/bridal-collection-categories';
const KEY='mazhari_home_trial_v1';
@Injectable({providedIn:'root'})
export class HomeTrialService{
 readonly items=signal<BridalSampleProduct[]>(this.load());
 add(p:BridalSampleProduct):string{if(this.items().some(x=>x.id===p.id))return'این کالا قبلاً انتخاب شده است.';if(this.items().length>=5)return'حداکثر ۵ کالا قابل انتخاب است.';this.items.update(v=>[...v,p]);this.save();return''}
 remove(id:string){this.items.update(v=>v.filter(x=>x.id!==id));this.save()}
 clear(){this.items.set([]);this.save()}
 private save(){localStorage.setItem(KEY,JSON.stringify(this.items()))}
 private load():BridalSampleProduct[]{try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]') as Array<string|BridalSampleProduct>;return raw.map(item=>typeof item==='string'?getBridalProductById(item):item).filter((x):x is BridalSampleProduct=>!!x)}catch{return[]}}
}
