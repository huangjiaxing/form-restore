/*
 * @Desc: 业务相关的工具类
 * @Author: huangjiaxing
 * @Date: 2021-11-30 17:36:09
 * @Last Modified by: huangjiaxing
 * @Last Modified time: 2021-12-28 01:40:57
 */

// 获取元素的唯一选择器
export const getUniqueSelector = ele => {
  const eleTagName = ele.tagName.toLowerCase()
  const lastSelector = ele.id
    ? `#${ele.id}`
    : ele.name
      ? `[name="${ele.name}"]`
      : ''

  // 元素在同级元素的顺序
  const index = Array.prototype.indexOf.call(
    ele.parentNode.querySelectorAll(`${eleTagName}${lastSelector}`),
    ele
  )

  return {
    selector: `${eleTagName}${lastSelector}`,
    index,
  }
}

// 获取form的所有name和value
export const getFormData = form => {
  const formData = {}
  const elements = form.elements
  for (let i = 0, len = elements.length; i < len; i++) {
    const ele = elements[i]
    if (ele.name) {
      if ('radio|checkbox'.includes(ele.type.toLowerCase()) && !ele.checked) {
        continue
      }
      formData[ele.name] = ele.value
    }
  }
  return formData
}

// 设置form元素的值，包含textarea、input[type='text']等
export const setFormData = (form, formData) => {
  const elements = form.elements
  for (let i = 0, len = elements.length; i < len; i++) {
    const ele = elements[i]
    if (ele.name && shouldUpdateValue(ele)) {
      ele.value =
        typeof formData[ele.name] === 'undefined' ? '' : formData[ele.name]
    }
  }
}

// 是否需要更新value值，解决部分表单类型实际提交值并不是value字段的问题
function shouldUpdateValue(ele) {
  if (
    (ele.tagName.toLowerCase() === 'input' &&
      !['button', 'radio', 'checkbox'].includes(ele.type.toLowerCase())) ||
    ele.tagName.toLowerCase() === 'textarea'
  ) {
    return true
  }
  return false
}

// 获取自定义区域的DOM结构
export const getCustomDOM = (form, customDOMAttr, customDOMAttrContent) => {
  const customDOM = []
  const elements = form.querySelectorAll(`[${customDOMAttr}] [${customDOMAttrContent}]`)

  for (let i = 0, len = elements.length; i < len; i++) {
    const ele = elements[i]
    if (ele.innerHTML) {
      const expanded = ele.innerHTML

      // 删除节点之间的冗余字符
      const collapsed = expanded.replace(
        /(<(pre|script|style|textarea)[^]+?<\/\2)|(^|>)\s+|\s+(?=<|$)/g,
        '$1$3'
      )
      customDOM.push(collapsed)
    }
  }
  return customDOM
}

// 获取选择器名称
export const getEleTypeName = ele => {
  return `${ele.tagName.toLowerCase()}${ele.getAttribute('type') ? '[type="' + ele.getAttribute('type') + '"]' : ''
    }`
}

// 比较两个对象是否相等，并且找到不相等的key
export const compareObject = (obj1, obj2) => {
  const keys = Object.keys(obj1)
  const result = []
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i]
    if (obj1[key] !== obj2[key]) {
      result.push({
        name: key,
        oldValue: obj1[key],
        newValue: obj2[key],
      })
    }
  }
  return result
}
