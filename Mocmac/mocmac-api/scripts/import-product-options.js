import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';

const args=process.argv.slice(2);
const apply=args.includes('--apply');
const backupIndex=args.indexOf('--backup');
const backupPath=backupIndex>=0?args[backupIndex+1]:null;
if(apply&&!backupPath)throw new Error('Cần --backup <path> trước khi cập nhật.');
const supplied=JSON.parse(await fs.readFile(new URL('../data/product-options.json',import.meta.url),'utf8'));
assert.equal(new Set(supplied.map(row=>row.id)).size,supplied.length,'Trùng mã sản phẩm.');
try {
 await mongoose.connect(process.env.MONGODB_URI,{autoIndex:false,serverSelectionTimeoutMS:8000});
 const collection=mongoose.connection.db.collection('products');
 const products=await collection.find({}).toArray();
 const byId=new Map(products.map(product=>[product.id,product]));
 assert.equal(products.length,supplied.length,'Danh mục và file cấu hình chưa khớp.');
 const changes=[];
 for(const row of supplied){
  const current=byId.get(row.id);
  assert.ok(current,`Không tìm thấy sản phẩm ${row.id}.`);
  assert.equal(current.name,row.name,`Tên sản phẩm ${row.id} đã thay đổi.`);
  assert.ok(row.images.length>=2,`Sản phẩm ${row.id} cần thêm ảnh.`);
  assert.equal(new Set(row.images).size,row.images.length,'Ảnh bị lặp URL.');
  assert.equal(new Set(row.variants.map(v=>v.id)).size,row.variants.length,'Trùng mã phiên bản.');
  const combinations=new Set();
  for(const variant of row.variants){
   assert.match(variant.id,/^[a-z0-9-]{1,80}$/);
   assert.ok(Number.isFinite(variant.price)&&variant.price>=current.price,'Giá phiên bản không hợp lệ.');
   assert.ok(variant.attributes.length&&variant.label,'Thiếu thông tin phiên bản.');
   const combination=JSON.stringify([...variant.attributes].sort((a,b)=>a.name.localeCompare(b.name)).map(a=>[a.name,a.value]));
   assert.ok(!combinations.has(combination),'Trùng tổ hợp lựa chọn.');combinations.add(combination);
  }
  if(row.variants.length)assert.equal(row.variants[0].price,current.price,'Giá mặc định phải giữ nguyên.');
  await new Product({...current,images:row.images,variants:row.variants}).validate();
  if(JSON.stringify(current.images)===JSON.stringify(row.images)&&JSON.stringify(current.variants??[])===JSON.stringify(row.variants))continue;
  changes.push({current,fields:{images:row.images,variants:row.variants}});
 }
 const report={createdAt:new Date().toISOString(),planned:changes.length,modified:0,previous:changes.map(({current})=>({id:current.id,_id:String(current._id),images:current.images,variants:current.variants??null,variantsPresent:Object.hasOwn(current,'variants')}))};
 if(apply){
  const target=path.resolve(backupPath);await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,JSON.stringify(report,null,2),{flag:'wx'});
  if(changes.length){const result=await collection.bulkWrite(changes.map(({current,fields})=>({updateOne:{filter:{_id:current._id,name:current.name,images:current.images},update:{$set:fields}}})),{ordered:true});report.modified=result.modifiedCount;await fs.writeFile(target,JSON.stringify(report,null,2));assert.equal(result.matchedCount,changes.length,'Dữ liệu đã thay đổi trong khi cập nhật.');}
 }
 console.log(JSON.stringify({mode:apply?'applied':'dry-run',products:supplied.length,withVariants:supplied.filter(row=>row.variants.length).length,planned:report.planned,modified:report.modified,backupPath:apply?path.resolve(backupPath):null},null,2));
}finally{await mongoose.disconnect();}
