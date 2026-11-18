(()=>{
'use strict';
const files=[
'DSC06171.jpg','DSC06198.jpg','DSC06201.jpg','DSC06211.jpg','DSC06219.jpg','DSC06230.jpg',
'DSC06241.jpg','DSC06291.jpg','DSC06306.jpg','DSC06349.jpg','DSC06361.jpg','DSC06363.jpg',
'DSC06405.jpg','DSC06407.jpg','DSC06740.jpg','IMG-20220618-WA0011.jpg','IMG-20220618-WA0024.jpg',
'IMG-20220618-WA0031.jpg','IMG-20220618-WA0034.jpg','IMG-20220618-WA0050.jpg',
'20251114_201625511_iOS.jpg','20251121_200748949_iOS.jpg','IMG_7979.jpg'];
const base='assets/images/photoshoot-2022/';
const section=document.querySelector('#galerij');
const original=section?.querySelector('.gallery');
if(!original)return;
if(original.dataset.vaReelReady)return;
original.dataset.vaReelReady='true';
const title=section.querySelector('h2');if(title)title.textContent='In beeld';
const subtitle=section.querySelector('h2 + p');if(subtitle)subtitle.textContent='On & off stage — swipe, ontdek en klik voor groot beeld.';
const viewport=document.createElement('div');viewport.className='va-reel-viewport';viewport.setAttribute('aria-label','Doorlopende Voltage Avenue fotogalerij');viewport.tabIndex=0;
const track=document.createElement('div');track.className='va-reel-track';
const chunks=[files.slice(0,6),files.slice(6,12),files.slice(12,18),files.slice(18)];
function makeSet(copy){const set=document.createElement('div');set.className='va-reel-set';set.setAttribute('aria-hidden',copy?'true':'false');
 chunks.forEach((chunk,pi)=>{const panel=document.createElement('div');panel.className='va-reel-panel';
 chunk.forEach((name,ti)=>{const idx=files.indexOf(name);const button=document.createElement('button');button.type='button';button.className='va-reel-tile'+(ti===0?' va-reel-large':'')+(chunk.length===5&&ti===1?' va-reel-tall':'');button.setAttribute('aria-label',`Open foto ${idx+1} van ${files.length}`);button.tabIndex=copy?-1:0;
 const img=document.createElement('img');img.src=base+encodeURIComponent(name);img.alt=`Voltage Avenue — foto ${idx+1}`;img.loading=pi===0&&!copy?'eager':'lazy';img.decoding='async';button.append(img);button.addEventListener('click',()=>open(idx));panel.append(button);});set.append(panel);});return set;}
const first=makeSet(false),second=makeSet(true);track.append(first,second);viewport.append(track);
const controls=document.createElement('div');controls.className='va-reel-controls';controls.innerHTML='<button type="button" class="va-reel-prev" aria-label="Galerij naar links">‹</button><button type="button" class="va-reel-toggle" aria-label="Beweging pauzeren" aria-pressed="false">Pauze Ⅱ</button><button type="button" class="va-reel-next" aria-label="Galerij naar rechts">›</button>';
original.replaceWith(viewport);viewport.after(controls);
let paused=false,last=0,manualUntil=0,carry=0;const speed=38;
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function cycle(){return first.getBoundingClientRect().width;}
function normalize(){const width=cycle();if(width>0&&viewport.scrollLeft>=width)viewport.scrollLeft-=width;}
function frame(now){if(last){const dt=Math.min(100,now-last);if(!paused&&!document.hidden&&!prefersReduced.matches&&now>manualUntil){carry+=speed*dt/1000;const step=Math.floor(carry);if(step>0){viewport.scrollLeft+=step;carry-=step;normalize();}}}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
viewport.addEventListener('scroll',normalize,{passive:true});
viewport.addEventListener('pointerdown',()=>manualUntil=performance.now()+4000,{passive:true});
viewport.addEventListener('touchstart',()=>manualUntil=performance.now()+4000,{passive:true});
viewport.addEventListener('wheel',()=>manualUntil=performance.now()+3000,{passive:true});
const toggle=controls.querySelector('.va-reel-toggle');toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'Afspelen ▶':'Pauze Ⅱ';toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Beweging hervatten':'Beweging pauzeren');});
controls.querySelector('.va-reel-prev').addEventListener('click',()=>{manualUntil=performance.now()+3500;if(viewport.scrollLeft<280)viewport.scrollLeft+=cycle();viewport.scrollBy({left:-320,behavior:'smooth'});});
controls.querySelector('.va-reel-next').addEventListener('click',()=>{manualUntil=performance.now()+3500;viewport.scrollBy({left:320,behavior:'smooth'});});
const bio=document.querySelector('#bio .section-inner');if(bio&&!bio.querySelector('.va-bio-photo')){const figure=document.createElement('figure');figure.className='va-bio-photo';const img=document.createElement('img');img.src=base+encodeURIComponent(files[0]);img.alt='Voltage Avenue — bandfotografie';img.loading='lazy';figure.append(img);bio.append(figure);}
let current=0,lastFocus=null;const modal=document.createElement('div');modal.className='va-photo-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Fotogalerij Voltage Avenue');modal.innerHTML='<button class="va-photo-close" type="button" aria-label="Sluiten">×</button><button class="va-photo-prev" type="button" aria-label="Vorige foto">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="va-photo-next" type="button" aria-label="Volgende foto">›</button>';document.body.append(modal);
const modalImg=modal.querySelector('img'),caption=modal.querySelector('figcaption');
function render(){modalImg.src=base+encodeURIComponent(files[current]);modalImg.alt=`Voltage Avenue — foto ${current+1}`;caption.textContent=`${current+1} / ${files.length}`;}
function open(i){lastFocus=document.activeElement;current=i;render();modal.hidden=false;document.body.classList.add('va-gallery-open');modal.querySelector('.va-photo-close').focus();}
function close(){modal.hidden=true;document.body.classList.remove('va-gallery-open');lastFocus?.focus();}
function step(delta){current=(current+delta+files.length)%files.length;render();}
modal.querySelector('.va-photo-close').addEventListener('click',close);modal.querySelector('.va-photo-prev').addEventListener('click',()=>step(-1));modal.querySelector('.va-photo-next').addEventListener('click',()=>step(1));modal.addEventListener('click',e=>{if(e.target===modal)close();});
document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);if(e.key==='Tab'){const items=[...modal.querySelectorAll('button')];const index=items.indexOf(document.activeElement);if(e.shiftKey&&index===0){e.preventDefault();items[items.length-1].focus();}else if(!e.shiftKey&&index===items.length-1){e.preventDefault();items[0].focus();}}});
let touchX=0;modalImg.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX;},{passive:true});modalImg.addEventListener('touchend',e=>{const delta=e.changedTouches[0].screenX-touchX;if(Math.abs(delta)>55)step(delta<0?1:-1);},{passive:true});
})();
