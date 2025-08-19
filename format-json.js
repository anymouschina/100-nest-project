/**
 * 深度遍历对象或数组，移除所有字符串值中的反引号 (`).
 * @param {any} data - 输入的数据，可以是任何类型.
 * @returns {any} - 返回一个清除了反引号的新对象或数组.
 */
function removeBackticksDeep(data) {
  // 1. 如果是字符串，直接替换反引号
  if (typeof data === 'string') {
    return data.replaceAll('`', '');
  }

  // 2. 如果是数组，遍历每个元素并递归调用
  if (Array.isArray(data)) {
    return data.map(item => removeBackticksDeep(item));
  }

  // 3. 如果是对象（但不是 null），遍历每个值并递归调用
  if (typeof data === 'object' && data !== null) {
    // 使用 Object.entries 和 reduce 创建一个新对象
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = removeBackticksDeep(value);
      return acc;
    }, {});
  }

  // 4. 对于其他类型 (number, boolean, null, undefined)，直接返回
  return data;
}

// --- 示例 ---

// 1. 创建一个包含反引号的复杂对象
const originalObject = {
  id: 123,
  name: '这是一个`带有`反引号的`名字`',
  description: 'Some text with `backticks`.',
  details: {
    nestedKey: '`another` value with `backticks`',
    price: 99.9,
    tags: [
      'tag1',
      'tag`2',
      {
        deepTag: 'a`deep`tag`'
      }
    ]
  },
  isActive: true,
  metadata: null
};

// 2. 使用函数进行格式化
const cleanObject = removeBackticksDeep(originalObject);

// 3. 将格式化后的对象转换为 JSON 字符串
const jsonString = JSON.stringify(cleanObject, null, 2); // 使用 2 个空格进行美化输出

// 4. 打印结果
console.log('--- 原始对象 ---');
console.log(originalObject);

console.log('\n--- 清理后的对象 ---');
console.log(cleanObject);

console.log('\n--- 最终的 JSON 字符串 (可用于 HTTP 请求) ---');
console.log(jsonString);

/*
--- 预期的输出 ---

--- 原始对象 ---
{
  id: 123,
  name: '这是一个`带有`反引号的`名字`',
  description: 'Some text with `backticks`.',
  details: {
    nestedKey: '`another` value with `backticks`',
    price: 99.9,
    tags: [ 'tag1', 'tag`2', { deepTag: 'a`deep`tag`' } ]
  },
  isActive: true,
  metadata: null
}

--- 清理后的对象 ---
{
  id: 123,
  name: '这是一个带有反引号的名字',
  description: 'Some text with backticks.',
  details: {
    nestedKey: 'another value with backticks',
    price: 99.9,
    tags: [ 'tag1', 'tag2', { deepTag: 'adeeptag' } ]
  },
  isActive: true,
  metadata: null
}

--- 最终的 JSON 字符串 (可用于 HTTP 请求) ---
{
  "id": 123,
  "name": "这是一个带有反引号的名字",
  "description": "Some text with backticks.",
  "details": {
    "nestedKey": "another value with backticks",
    "price": 99.9,
    "tags": [
      "tag1",
      "tag2",
      {
        "deepTag": "adeeptag"
      }
    ]
  },
  "isActive": true,
  "metadata": null
}

*/
