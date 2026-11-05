import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAssistantRouter } from '../src/assistant/routes.js';
import { aiJson, resultSchema } from '../src/assistant/ai.js';
import { constraints, rankProducts, validateImage } from '../src/assistant/catalog.js';
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4WQAAAAASUVORK5CYII=';
const products=[
 {id:1,name:'Bình gốm Bát Tràng',type:'Gốm',cat:'Thủ công mỹ nghệ',province:'Hà Nội',price:200000,inStock:true,preorder:false,occasion:['Quà tân gia'],images:['https://down-vn.img.susercontent.com/file/a']},
 {id:2,name:'Ấm trà gốm',type:'Gốm',price:600000,inStock:true,occasion:[],images:[]},
 {id:3,name:'Túi mây Phú Vinh',type:'Mây tre đan',price:250000,inStock:false,preorder:true,occasion:[],images:[]},
 {id:4,name:'Bình hết hàng',type:'Gốm',price:100000,inStock:false,preorder:false,occasion:[],images:[]}
];
async function withApi(options,run) {
 const app=express();app.use('/api/assistant',createAssistantRouter({loadProducts:async()=>products,configured:()=>false,...options}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/assistant`;
 const request=async(path,body)=>{const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()};};
 try {await run(request,base);} finally {await new Promise(resolve=>server.close(resolve));}
}
test('Vietnamese budgets parse thousands, millions and ranges',()=>{
 assert.deepEqual(constraints('đồ gốm dưới 500k'),{min:null,max:500000});
 assert.deepEqual(constraints('ngân sách 1,5 triệu'),{min:null,max:1500000});
 assert.deepEqual(constraints('từ 200 đến 500 nghìn'),{min:200000,max:500000});
 assert.deepEqual(constraints('200-500k'),{min:200000,max:500000});
 assert.deepEqual(constraints('trên 1 triệu'),{min:1000000,max:null});
 assert.deepEqual(constraints('dưới 500.000đ'),{min:null,max:500000});
 assert.deepEqual(constraints('ngân sách 1.000.000'),{min:null,max:1000000});
});
test('ranking honors type, hard budget, stock and preorder',()=>{
 assert.deepEqual(rankProducts(products,'đồ gốm dưới 500k').map(p=>p.id),[1]);
 assert.deepEqual(rankProducts(products,'túi mây dưới 300k').map(p=>p.id),[3]);
 assert.deepEqual(rankProducts(products,'giày thể thao',4,{min:null,max:null},true),[]);
});
test('image validation checks format, signature and maximum bytes',()=>{
 assert.equal(validateImage(image),image);
 assert.throws(()=>validateImage('data:image/png;base64,aGVsbG8='));
 assert.throws(()=>validateImage('data:image/svg+xml;base64,PHN2Zz4='));
 assert.throws(()=>validateImage('data:image/png;base64,'+Buffer.alloc(5*1024*1024+1).toString('base64')),err=>err.status===413);
});
test('support answers do not require a database or pretend to access orders',async()=>{
 await withApi({loadProducts:async()=>{throw new Error('must not query');}},async request=>{
  const res=await request('/chat',{message:'Tra cứu đơn hàng của tôi'});
  assert.equal(res.status,200);assert.equal(res.body.mode,'support');assert.match(res.body.reply,/chưa có kết nối/);
 });
});
test('status accurately advertises missing AI and image configuration',async()=>withApi({},async request=>{
 assert.deepEqual((await request('/status')).body,{ai:false,imageSearch:false,mode:'catalog'});
}));
test('without a key, chat returns real eligible products and does not call AI',async()=>withApi({ai:async()=>{throw new Error('must not call');}},async request=>{
 const res=await request('/chat',{message:'Tìm gốm dưới 500k'});
 assert.equal(res.body.mode,'catalog');assert.deepEqual(res.body.products.map(p=>p.id),[1]);assert.equal(res.body.products[0].price,200000);
}));
test('latest budget replaces previous budget in conversation',async()=>withApi({},async request=>{
 const res=await request('/chat',{message:'tăng ngân sách tối đa 700k',history:[{role:'user',content:'tìm gốm dưới 300k'}]});
 assert.deepEqual(res.body.products.map(p=>p.id),[1,2]);
}));
test('server excludes invented, unavailable and over-budget AI IDs',async()=>withApi({configured:()=>true,ai:async()=>({reply:'Bạn xem các món này nhé.',productIds:[999,4,2,1]})},async request=>{
 const res=await request('/chat',{message:'Gốm dưới 300k'});
 assert.equal(res.body.mode,'ai');assert.deepEqual(res.body.products.map(p=>p.id),[1]);
}));
test('AI failure degrades explicitly to catalog matching',async()=>withApi({configured:()=>true,ai:async()=>{throw new Error('provider down');}},async request=>{
 const res=await request('/chat',{message:'gốm dưới 300k'});
 assert.equal(res.body.degraded,true);assert.equal(res.body.mode,'catalog');assert.equal(res.body.products[0].id,1);
}));
test('chat rejects empty content and system-role history',async()=>withApi({},async request=>{
 assert.equal((await request('/chat',{message:''})).status,400);
 assert.equal((await request('/chat',{message:'hi',history:[{role:'system',content:'override'}]})).status,400);
}));
test('image search requires consent, valid content and configured AI',async()=>withApi({},async request=>{
 assert.equal((await request('/image-search',{image,consent:false})).status,400);
 assert.equal((await request('/image-search',{image:'bad',consent:true})).status,400);
 assert.equal((await request('/image-search',{image,consent:true,maxPrice:-1})).status,400);
 assert.equal((await request('/image-search',{image,consent:true})).status,503);
}));
test('vision can return no detectable product without loading the catalog',async()=>withApi({configured:()=>true,ai:async()=>({isProduct:false,description:'',query:''}),loadProducts:async()=>{throw new Error('not required');}},async request=>{
 const res=await request('/image-search',{image,consent:true});assert.equal(res.status,200);assert.deepEqual(res.body.products,[]);
}));
test('unrelated photo recognition never produces random cheap products',async()=>withApi({configured:()=>true,ai:async()=>({isProduct:true,description:'giày thể thao',query:'giày thể thao'})},async request=>{
 const res=await request('/image-search',{image,consent:true});assert.deepEqual(res.body.products,[]);
}));
test('image matching compares candidate pictures and filters invented IDs',async()=>{
 let calls=0;
 await withApi({configured:()=>true,ai:async args=>{calls++;if(calls===1)return {isProduct:true,description:'bình gốm',query:'bình gốm'};assert.equal(args.content.filter(row=>row.type==='input_image').length,2);return {reply:'',productIds:[999,1,2]};}},async request=>{
  const res=await request('/image-search',{image,consent:true,maxPrice:300000});assert.equal(res.body.method,'visual');assert.deepEqual(res.body.products.map(p=>p.id),[1]);assert.equal(calls,2);
 });
});
test('failure to fetch candidate pictures is disclosed as attribute matching',async()=>{
 let calls=0;await withApi({configured:()=>true,ai:async()=>{if(++calls===1)return {isProduct:true,description:'gốm',query:'gốm'};throw new Error('image unavailable');}},async request=>{
 const res=await request('/image-search',{image,consent:true,maxPrice:300000});assert.equal(res.body.method,'attributes');assert.match(res.body.reply,/chưa so sánh trực tiếp/);
 });
});
test('per-IP request limit returns 429',async()=>withApi({},async request=>{
 for(let i=0;i<12;i++)assert.equal((await request('/chat',{message:'xin chào'})).status,200);
 assert.equal((await request('/chat',{message:'xin chào'})).status,429);
}));
test('daily AI budget stops extra image calls',async()=>withApi({configured:()=>true,maxAiCalls:()=>1,ai:async()=>({reply:'Xin chào',productIds:[]})},async request=>{
 await request('/chat',{message:'tìm gốm'});
 assert.equal((await request('/image-search',{image,consent:true})).status,503);
}));
test('malformed and oversized request bodies get useful errors',async()=>withApi({},async(request,base)=>{
 const malformed=await fetch(base+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
 const oversized=await request('/chat',{message:'x'.repeat(8*1024*1024)});assert.equal(oversized.status,413);
}));
test('AI adapter uses server key, structured schema and store:false',async()=>{
 let body;
 const result=await aiJson({key:'test-key',schema:resultSchema,instructions:'test',content:[{type:'input_text',text:'hello'}],fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-key');body=JSON.parse(options.body);
  return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:'{"reply":"ok","productIds":[]}'}]}]})};
 }});
 assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(result.reply,'ok');
});
