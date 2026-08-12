import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '@core/services/cart.service';
import { CustomRequestApiService } from '@core/services/custom-request-api.service';
import { HomeTrialService } from '@core/services/home-trial.service';
import { JalaliDateInputComponent } from '@shared/components/jalali-date-input/jalali-date-input.component';

type LeafletPoint = [number, number];
interface LeafletMapClickEvent { latlng: { lat: number; lng: number }; }
interface LeafletMarker { setLatLng(point: LeafletPoint): void; }
interface LeafletMap {
  remove(): void;
  setView(point: LeafletPoint, zoom: number): LeafletMap;
  on(event: 'click', handler: (event: LeafletMapClickEvent) => void): void;
  invalidateSize(): void;
  panTo(point: LeafletPoint): void;
}
interface LeafletLayer { addTo(map: LeafletMap): unknown; }
interface LeafletMarkerFactory { addTo(map: LeafletMap): LeafletMarker; }
interface LeafletApi {
  map(element: HTMLElement, options: { zoomControl: boolean; attributionControl: boolean }): LeafletMap;
  tileLayer(url: string, options: { maxZoom: number; attribution: string }): LeafletLayer;
  marker(point: LeafletPoint): LeafletMarkerFactory;
}

declare global { interface Window { L?: LeafletApi; } }
@Component({selector:'app-home-trial',standalone:true,imports:[FormsModule,RouterLink,JalaliDateInputComponent],templateUrl:'./home-trial.component.html',styleUrls:['./home-trial.component.css']})
export class HomeTrialComponent implements AfterViewInit,OnDestroy{
 @ViewChild('map') mapEl!:ElementRef<HTMLElement>;
 readonly trial=inject(HomeTrialService);private api=inject(CustomRequestApiService);private cart=inject(CartService);private router=inject(Router);private platformId=inject(PLATFORM_ID);private map?:LeafletMap;private marker?:LeafletMarker;
 readonly deposit=10_000_000;readonly districts=Array.from({length:22},(_,i)=>i+1);readonly hours=Array.from({length:12},(_,i)=>String(i+9).padStart(2,'0'));readonly minDate=this.iso(new Date());
 model={fullName:'',phone:'',district:0,address:'',date:'',hour:'',minute:'00',lat:0,lng:0};error='';busy=false;
 ngAfterViewInit(){if(isPlatformBrowser(this.platformId))void this.loadMap()}ngOnDestroy(){this.map?.remove()}
 get availableMinutes(){return this.model.hour==='20'?['00']:['00','30']}
 hourChanged(){if(this.model.hour==='20')this.model.minute='00'}
 private async loadMap(){if(!document.querySelector('link[data-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset['leaflet']='1';document.head.appendChild(l)}if(!window.L){await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>resolve();s.onerror=()=>reject();document.head.appendChild(s)})}const L=window.L;if(!L)return;this.map=L.map(this.mapEl.nativeElement,{zoomControl:true,attributionControl:true}).setView([35.7219,51.3347],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(this.map);this.map.on('click',(e:LeafletMapClickEvent)=>this.setPoint(e.latlng.lat,e.latlng.lng));setTimeout(()=>this.map?.invalidateSize(),0)}
 private setPoint(lat:number,lng:number){if(!this.inTehran(lat,lng)){this.error='نقطه انتخابی خارج از محدوده مناطق تهران است.';return}this.model.lat=lat;this.model.lng=lng;this.error='';const L=window.L;if(!L||!this.map)return;if(this.marker)this.marker.setLatLng([lat,lng]);else this.marker=L.marker([lat,lng]).addTo(this.map);this.map.panTo([lat,lng])}
 locate(){if(!navigator.geolocation){this.error='موقعیت‌یابی در این مرورگر فعال نیست.';return}navigator.geolocation.getCurrentPosition(p=>this.setPoint(p.coords.latitude,p.coords.longitude),()=>this.error='اجازه دسترسی به موقعیت مکانی داده نشد.')}
 submit(){const time=this.model.hour?`${this.model.hour}:${this.model.minute}`:'';if(!this.trial.items().length||this.trial.items().length>5||!this.model.fullName.trim()||!/^09\d{9}$/.test(this.model.phone)||!this.model.district||!this.model.address.trim()||!this.model.date||!time||!this.model.lat){this.error='کالاها، اطلاعات فردی، تاریخ، ساعت، آدرس و نقطه نقشه را کامل کنید.';return}const data=new FormData();data.set('type','home-trial');data.set('fullName',this.model.fullName);data.set('phone',this.model.phone);data.set('city',`تهران، منطقه ${this.model.district}`);data.set('ceremonyDate',this.model.date);data.set('contactTime','anytime');data.set('preferredContact','phone');data.set('modelTitle',this.trial.items().map(x=>`${x.name} (${x.id})`).join('، '));data.set('description',`تحویل: ${this.model.date} ساعت ${time}\nآدرس: ${this.model.address}\nموقعیت: ${this.model.lat},${this.model.lng}\nپیک تا ۳۰ دقیقه منتظر می‌ماند.`);data.set('budget','بیعانه یک میلیون تومان');this.busy=true;this.api.create(data).subscribe({next:r=>{this.cart.addProductToCart(99000001,1,this.deposit,'بیعانه تست در محل','assets/images/cat-hair-accessories.webp',{categorySlug:'home-trial',sourceId:'HOME-TRIAL-DEPOSIT',attributes:[{name:'شناسه درخواست',value:r.id},{name:'زمان تحویل',value:`${this.model.date} - ${time}`},{name:'منطقه',value:String(this.model.district)},{name:'کالاهای تست',value:this.trial.items().map(item=>item.name).join('، ')}]});void this.router.navigate(['/cart'])},error:()=>{this.busy=false;this.error='ثبت درخواست انجام نشد؛ اتصال سرور را بررسی کنید.'}})}
 private inTehran(lat:number,lng:number){return lat>=35.45&&lat<=35.95&&lng>=51.05&&lng<=51.65}
 private iso(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
}
