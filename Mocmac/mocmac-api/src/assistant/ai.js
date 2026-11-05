export async function aiJson({ instructions, content, schema, name = 'assistant_reply', fetchImpl = fetch, key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4.1-mini' }) {
  if (!key) throw Object.assign(new Error('AI chưa được cấu hình.'), { code:'NOT_CONFIGURED' });
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method:'POST', signal:AbortSignal.timeout(45000),
    headers:{ 'Authorization':`Bearer ${key}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ model, store:false, max_output_tokens:1300, instructions,
      input:[{ role:'user', content }], text:{ format:{ type:'json_schema', name, strict:true, schema } } })
  });
  if (!response.ok) throw Object.assign(new Error('Dịch vụ AI tạm thời không khả dụng.'), { code:'UPSTREAM', upstreamStatus:response.status });
  const data = await response.json();
  if (data.status !== 'completed') throw new Error('AI chưa hoàn tất phản hồi.');
  const text = (data.output || []).flatMap(row => row.content || []).filter(row => row.type === 'output_text').map(row => row.text).join('');
  if (!text) throw new Error('AI không có kết quả phù hợp.');
  return JSON.parse(text);
}
export const resultSchema = { type:'object', additionalProperties:false, properties:{ reply:{type:'string'}, productIds:{ type:'array', items:{type:'integer'}, maxItems:4 } }, required:['reply','productIds'] };
export const visionSchema = { type:'object', additionalProperties:false, properties:{ isProduct:{type:'boolean'}, description:{type:'string'}, query:{type:'string'} }, required:['isProduct','description','query'] };
