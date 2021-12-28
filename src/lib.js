/*
 * @Desc: 基础工具类 
 * @Author: huangjiaxing 
 * @Date: 2021-11-30 17:35:37 
 * @Last Modified by: huangjiaxing
 * @Last Modified time: 2021-12-27 16:52:02
 */

// alert和confirm的备份
const backupConfirm = window.confirm
const backupAlert = window.alert

// 禁止掉原生的confirm和alert，默认行为为 确定
export const disableWindowAction = () => {
  window.alert = window.confirm = function () {
    return true
  }
}

// 恢复原生的confirm和alert
export const resumeWindowAction = () => {
  window.alert = backupAlert
  window.confirm = backupConfirm
}

// 数组去重
export const uniqueArray = arr => {
  return Array.from(new Set(arr))
}

// DON节点父级是否包含某个属性
export const parentHasAttr = (ele, attr) => {
  if (!ele) return false

  let parent = ele.parentNode
  while (parent && parent.nodeType === 1) {
    if (parent.hasAttribute(attr)) {
      return true
    }
    parent = parent.parentNode
  }
  return false
}
