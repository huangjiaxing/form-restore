import Restore from '../src/index'

// 初始化还原对象
window.record = new Restore({
  form: document.querySelector('#test-form'),  // 表单的handler
  customListenType: {  // 自定义需要监听的元素类型和监听的事件
    'span[type="button"]': 'click',
  }
})

// 开启记录
window.record.init()

// // 保存当前表单状态
// window.record.holdForm()

// // 还原表单
// window.record.recoverForm()
