import { chromium } from '@playwright/test';
const url=process.argv[2];
if(!url || new URL(url).protocol!=='https:') throw Error('Pass the deployed HTTPS URL');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:60000});
  if(response?.status()!==200)throw Error(`HTTP ${response?.status()}`);
  await page.getByRole('heading',{name:'Better retrieval. By reasoning.'}).waitFor();
  await page.getByLabel('Dataset',{exact:true}).selectOption('2');
  await page.getByRole('heading',{name:'MultiHop-RAG',exact:true}).waitFor();
  await page.getByRole('button',{name:'Open Figure 1: The complete architecture'}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByLabel('Close figure').click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'test-results/live-desktop.png'});
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({url:page.url(),status:response.status(),title:await page.title(),consoleErrors:errors,interactions:'dataset selector and original figure modal passed'}));
} finally {await browser.close()}
