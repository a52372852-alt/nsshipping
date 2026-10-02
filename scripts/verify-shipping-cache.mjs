// Exercise the real production export with controlled network latency and updates.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const root=path.resolve(process.argv[2] || 'out');
const worker=await readFile(path.join(root,'shipping-cache-worker.js'),'utf8');
const initial=worker.match(/const VERSION = "([^"]+)"/)[1];
let version=initial, delay=0, broken=false;
const server=createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  // Production canonicalizes literal brackets in dynamic-route chunk paths.
  if(/[\[\]]/.test(url.pathname)){res.writeHead(308,{Location:url.pathname.replaceAll('[','%5B').replaceAll(']','%5D')});res.end();return;}
  const relative=url.pathname==='/'?'index.html':url.pathname==='/my-shipping'?'my-shipping.html':decodeURIComponent(url.pathname.slice(1));
  const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw Error('Invalid path');
  let data=await readFile(file);
  if(broken&&relative.endsWith('.css')){res.writeHead(503);res.end();return;}
  if(relative==='shipping-cache-worker.js'||relative.endsWith('.html'))data=Buffer.from(data.toString().replaceAll(initial,version));
  if(delay)await new Promise(r=>setTimeout(r,delay));
  res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.html')?'text/html':'application/octet-stream');
  res.setHeader('Cache-Control','no-store');res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 delay=800;
 const baseline=await browser.newContext({serviceWorkers:'block'});const base=await baseline.newPage();
 const start=Date.now();await base.goto(origin+'/my-shipping',{waitUntil:'load'});const before=Date.now()-start;await baseline.close();
 delay=0;
 const context=await browser.newContext();const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/my-shipping');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.getByLabel('발송인 전화번호',{exact:true}).fill('02-0000-0000');
 delay=800;
 const cachedStart=Date.now();const response=await page.reload({waitUntil:'load'});const after=Date.now()-cachedStart;
 assert.ok(response.fromServiceWorker());assert.ok(after<before/2,`${before} -> ${after}`);
 assert.equal(await page.getByLabel('발송인 전화번호',{exact:true}).inputValue(),'02-0000-0000');
 await context.setOffline(true);
 await page.goto(origin+'/');await page.getByRole('heading',{name:'주문 엑셀을 여기에 놓아주세요'}).waitFor();
 await page.goto(origin+'/my-shipping');await page.getByLabel('발송인 전화번호',{exact:true}).waitFor();
 const keys=await page.evaluate(async()=>{
  const names=(await caches.keys()).filter(n=>n.startsWith('ns-shipping-public-shell-'));
  return (await Promise.all(names.map(async n=>(await (await caches.open(n)).keys()).map(r=>new URL(r.url).pathname)))).flat();
 });
 assert.ok(keys.every(k=>['/','/my-shipping','/vendor/crypto-worker.js'].includes(k)||k.startsWith('/_next/static/')));
 await context.setOffline(false);delay=0;
 version='verified-version-b';
 await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await page.waitForFunction(async()=> (await caches.keys()).some(n=>n.endsWith('verified-version-b')));
 await page.getByText('새 버전이 준비되었습니다.',{exact:false}).waitFor();
 assert.equal(await page.getByLabel('발송인 전화번호',{exact:true}).inputValue(),'02-0000-0000');
 await page.reload();assert.equal(await page.locator('meta[name="ns-shell-version"]').getAttribute('content'),version);
 // A partly unavailable deploy must not replace the working cached version.
 version='failed-version-c';broken=true;
 const state=await page.evaluate(async()=>{
  const r=await navigator.serviceWorker.getRegistration();await r.update();const w=r.installing;
  if(!w)return 'none';return await new Promise(resolve=>{w.addEventListener('statechange',()=>{if(['redundant','activated'].includes(w.state))resolve(w.state);});});
 });
 assert.equal(state,'redundant');await page.reload();assert.equal(await page.locator('meta[name="ns-shell-version"]').getAttribute('content'),'verified-version-b');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({beforeMs:before,afterMs:after,serverLatencyMs:800,offlineBothScreens:true,senderPreserved:true,updatePreservesWork:true,failedDeployRetainsOldVersion:true,cachedPublicResources:keys.length}));
 await context.close();
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
