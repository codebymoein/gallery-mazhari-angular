import { Component, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatJalaliDisplay, isoToJalali, JALALI_MONTHS, JALALI_WEEKDAYS, jalaliMonthLength, jalaliToIso, jalaliWeekdayIndex, todayJalali } from '@shared/utils/jalali';

interface Cell { empty?: boolean; day?: number; iso?: string; disabled?: boolean; selected?: boolean; today?: boolean; }
@Component({
 selector:'app-jalali-date-input',standalone:true,
 template:`<div class="jcal" dir="rtl"><header><button type="button" (click)="move(-1)" aria-label="ماه قبل">‹</button><strong>{{monthTitle}}</strong><button type="button" (click)="move(1)" aria-label="ماه بعد">›</button></header><div class="week">@for(w of weekdays;track w){<span>{{w}}</span>}</div><div class="grid">@for(c of cells;track $index){<button type="button" [class.empty]="c.empty" [class.selected]="c.selected" [class.today]="c.today" [disabled]="c.empty||c.disabled" (click)="choose(c)">{{c.day ? fa(c.day) : ''}}</button>}</div>@if(value){<p>تاریخ انتخاب‌شده: <b>{{display}}</b></p>}@else{<p class="muted">یک روز را از تقویم انتخاب کنید.</p>}</div>`,
 styles:[`.jcal{width:min(100%,18rem);margin:.2rem auto;padding:.65rem;border:1px solid var(--color-border,#ded4c5);border-radius:12px;background:var(--color-bg-cream,#faf7f1)}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem}header button{width:2rem;height:2rem;border:1px solid #ddd2c2;border-radius:7px;background:#fff;color:#7b5b20;font-size:1.1rem;cursor:pointer}header strong{font-size:.82rem}.week,.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:.12rem}.week span{display:grid;place-items:center;height:1.4rem;color:#8a8176;font-size:.62rem}.grid button{aspect-ratio:1;border:0;border-radius:7px;background:transparent;font:inherit;font-size:.72rem;cursor:pointer}.grid button:hover:not(:disabled){background:#eee2cc}.grid button.today:not(.selected){box-shadow:inset 0 0 0 1px #bd9445}.grid button.selected{background:#9a7427;color:#fff;font-weight:900}.grid button.empty{visibility:hidden}.grid button:disabled{opacity:.28;cursor:default}.jcal p{margin:.55rem 0 0;text-align:center;font-size:.72rem}.jcal .muted{color:#8b8277}`],
 providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>JalaliDateInputComponent),multi:true}]
})
export class JalaliDateInputComponent implements ControlValueAccessor,OnChanges{
 @Input() min='';@Input() max='';value='';viewYear=todayJalali().jy;viewMonth=todayJalali().jm;readonly weekdays=JALALI_WEEKDAYS;cells:Cell[]=[];disabled=false;private change:(v:string)=>void=()=>{};private touch:()=>void=()=>{};
 constructor(){this.build()}
 get monthTitle(){return `${JALALI_MONTHS[this.viewMonth-1]} ${this.fa(this.viewYear)}`}
 get display(){const j=isoToJalali(this.value);return j?formatJalaliDisplay(j.jy,j.jm,j.jd):''}
 writeValue(v:string){this.value=v||'';const j=isoToJalali(this.value);if(j){this.viewYear=j.jy;this.viewMonth=j.jm}this.build()}
 registerOnChange(fn:(v:string)=>void){this.change=fn}registerOnTouched(fn:()=>void){this.touch=fn}setDisabledState(v:boolean){this.disabled=v;this.build()}ngOnChanges(_c:SimpleChanges){this.build()}
 move(n:number){this.viewMonth+=n;if(this.viewMonth<1){this.viewMonth=12;this.viewYear--}if(this.viewMonth>12){this.viewMonth=1;this.viewYear++}this.build()}
 choose(c:Cell){if(!c.iso||c.disabled)return;this.value=c.iso;this.change(c.iso);this.touch();this.build()}
 fa(n:number){return n.toLocaleString('fa-IR',{useGrouping:false})}
 private build(){const out:Cell[]=Array.from({length:jalaliWeekdayIndex(this.viewYear,this.viewMonth,1)},()=>({empty:true}));const today=new Date().toISOString().slice(0,10);for(let d=1;d<=jalaliMonthLength(this.viewYear,this.viewMonth);d++){const iso=jalaliToIso(this.viewYear,this.viewMonth,d);out.push({day:d,iso,selected:iso===this.value,today:iso===today,disabled:this.disabled||!!this.min&&iso<this.min||!!this.max&&iso>this.max})}this.cells=out}
}
