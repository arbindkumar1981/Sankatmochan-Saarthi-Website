import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function fixture(page,role='super_admin'){
 let roster={revision:0,capabilities:role==='super_admin'?['accounts.manage','accounts.invite','audit.read']:['audit.read'],seats:{super_admin:1,website_admin:2,academic_admin:2,content_admin:3,user_admin:1,security_audit:1},members:{'synthetic-website':{role:'website_admin',enabled:true}},invitations:{}};
 let draft={revision:0,entries:[],publishedEntries:[],state:'draft'};
 await page.route('**/mock/**',async route=>{
  const request=route.request(),url=new URL(request.url());let result={};
  if(url.pathname.endsWith('/session'))result={role,capabilities:role==='super_admin'?['cms.read','cms.edit','cms.publish','accounts.manage','audit.read']:['audit.read']};
  else if(url.pathname.endsWith('/accounts/invite')){roster.revision++;roster.invitations['synthetic-invitation']={role:'content_admin',expiresAt:2000000000};result={invitation:'synthetic-invitation'};}
  else if(url.pathname.endsWith('/accounts/update')){const change=request.postDataJSON();roster.revision++;roster.members[change.target].enabled=change.action==='activate';result={revision:roster.revision};}
  else if(url.pathname.endsWith('/accounts'))result=roster;
  else if(url.pathname.endsWith('/cms')){if(request.method()==='POST'){const change=request.postDataJSON();draft={...draft,revision:draft.revision+1,entries:change.entries||draft.entries,state:change.action==='save'?'draft':change.action==='approve'?'approved':'published'};} result=draft;}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 await page.goto('/');await expect(page.getByRole('heading',{name:'Administrator accounts & secure access'})).toBeVisible();
}
for(const [name,width,height] of [['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]])test(`${name}: accessible responsive account and CMS workflow`,async({page})=>{
 await page.setViewportSize({width,height});await fixture(page);
 await page.getByRole('button',{name:'Load account roster'}).click();
 await page.getByLabel('Administrator email').fill('synthetic@example.test');
 await page.getByRole('button',{name:'Create invitation'}).click();
 await expect(page.getByText('Invitation ID: synthetic-invitation.',{exact:false})).toBeVisible();
 page.on('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Deactivate',exact:true}).click();
 await expect(page.getByRole('button',{name:'Activate',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Add section',exact:true}).click();
 await page.getByLabel('Title',{exact:true}).fill('Synthetic approved section');
 await page.getByLabel('Description',{exact:true}).fill('<script>must remain text</script>');
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.getByText('Revision 1 · draft')).toBeVisible();
 await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(accessibility.violations).toEqual([]);
 await page.screenshot({path:`tests/browser/artifacts/${name}-admin.png`,fullPage:true});
});
test('Audit role cannot use account invitation or CMS editing controls',async({page})=>{
 await fixture(page,'security_audit');await page.getByRole('button',{name:'Load account roster'}).click();
 await expect(page.getByRole('button',{name:'Create invitation'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Add section'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Deactivate',exact:true})).toBeDisabled();
});
