/*
 * @Desc: 暂存表单
 * @Author: huangjiaxing
 * @Date: 2021-11-30 17:36:46
 * @Last Modified by: huangjiaxing
 * @Last Modified time: 2021-12-28 12:19:56
 */

/* eslint-disable no-dupe-class-members */

import { uniqueArray, disableWindowAction, resumeWindowAction, parentHasAttr } from './lib'
import {
  getUniqueSelector,
  getFormData,
  setFormData,
  getCustomDOM,
  getEleTypeName,
  compareObject,
} from './utils'

/**
 * @description 暂存表单类
 * @class Restore
 */
class Restore {
  constructor(props) {
    const { form, customListenType } = props
    if (!form) {
      console.error('[Restore]必须要传入需要监听的表单容器form参数')
      return
    }

    // 绑定的form节点的DOM引用
    this.form = window.jQuery ? form instanceof window.jQuery ? form[0] : form : form

    // 存储用户所有的行为，记录元素类型和操作类型
    this.userActions = []

    // 已经保存的用户行为和表单数据
    this.store = []

    // 自定义保存的DOM容器属性名
    this.customDOMAttr = 'form-restore-custom'

    // 自定义保存的DOM属性名
    this.customDOMAttrContent = 'form-restore-custom-content'

    // 监听DOM变化的监听器
    this.observer = null

    // 恢复表单时，事件执行完毕的resolve
    this.eventResolver = null

    // 默认的恢复失败重置时间
    this.recoverTimeout = 3000

    /**
     * 定义需要监听的元素类型以及对应的事件
     * 元素的key为CSS选择器，值为事件名称，事件名称为事件类型，如click, mouseover, mouseout等
     */
    this.eleWithEvent = {
      input: 'blur',
      'input[type="text"]': 'blur',
      'input[type="button"]': 'click',
      'input[type="radio"]': 'click|change',
      'input[type="checkbox"]': 'click|change',
      textarea: 'blur',
      select: 'change',
      'button[type="button"]': 'click'
    }

    if (customListenType) {
      this.eleWithEvent = Object.assign({}, this.eleWithEvent, customListenType)
    }
  }

  /**
   * @description 创建事件数据结构
   * @param {String} id DOM元素的唯一标识
   * @param {String} eleType 元素类型
   * @param {String} eventName 事件名称
   * @param {Object} eleSelector 事件触发的元素的选择器地址
   * @param {String} eleName 元素的name
   * @param {Boolean} hasChangeDOM 是否改变了DOM结构
   * @returns {Object} 事件数据
   */
  // eslint-disable-next-line no-unused-vars
  #createEventModel({ id, eleType, eventName, eleSelector, eleName, hasChangeDOM }) {
    return { ...arguments[0] }
  }

  /**
   * @description 获取事件名称
   */
  #getEventNames() {
    const eventNames = []
    for (const key in this.eleWithEvent) {
      eventNames.push(...this.eleWithEvent[key].split('|'))
    }
    return uniqueArray(eventNames)
  }

  /**
   * @description 记录用户行为
   * @param {Event} e 事件对象
   * @param {String} eventName 事件名称
   * @memberof Restore
   */
  #addUserActions(e, eventName) {
    const ele = e.target
    const eleType = getEleTypeName(ele)
    const eleSelector = getUniqueSelector(ele)
    const eleName = ele.name
    const id = `${eleSelector.selector}-${eleSelector.index}`
    const hasChangeDOM = false
    if (this.eleWithEvent[eleType] && this.eleWithEvent[eleType].includes(eventName)) {
      const eventModel = this.#createEventModel({
        id,
        eleType,
        eventName,
        eleSelector,
        eleName,
        hasChangeDOM,
      })
      this.userActions.push(eventModel)
    }
  }

  /**
   * @description 过滤掉相同的用户行为，对userActions进行去重，保留最新的数据
   * 去除掉自定义DOM的事件
   * @memberof Restore
   */
  #filterSameAction() {
    const userActions = this.userActions
    const filterUserActions = []

    // userActions倒序遍历
    for (let i = userActions.length - 1; i >= 0; i--) {
      if (parentHasAttr(document.querySelectorAll(userActions[i].eleSelector.selector)[
        userActions[i].eleSelector.index
      ], this.customDOMAttr)) {
        continue
      }

      if (
        userActions[i].eleType.indexOf('[type="button"]') > -1 ||
        !filterUserActions.find(item => {
          return item.id === userActions[i].id
        })
      ) {
        // 像数组前面添加元素
        filterUserActions.unshift(userActions[i])
      }
    }
    this.userActions = filterUserActions
  }

  /**
   * @description 监听对应的事件
   * @memberof Restore
   */
  #listenEvent() {
    const eventNames = this.#getEventNames()
    eventNames.forEach(eventName => {
      this.form.addEventListener(
        eventName,
        e => {
          this.#addUserActions(e, eventName)
        },
        true
      )
    })
  }

  /**
   * @description 监听事件发生后DOM是否变化
   * @param {isRecover} Boolean 是否是恢复表单
   * @memberof Restore
   */
  #listenDOMChange(isRecover) {
    this.observer = new MutationObserver(mutations => {
      if (mutations.length) {
        if (!isRecover && this.userActions.length) {
          this.userActions.at(-1).hasChangeDOM = true
        }
        if (isRecover && this.eventResolver) {
          this.eventResolver()
          this.eventResolver = null
        }
      }
    })

    this.observer.observe(this.form, {
      childList: true,
      subtree: true
    })
  }

  /**
   * @description 开始记录用户操作
   * @memberof Restore
   */
  #record() {
    this.#listenEvent()
    this.#listenDOMChange(false)
  }

  /**
   * @description 恢复用户操作
   * @memberof Restore
   */
  async #recoverEvent() {
    const { actions, formData } = this.store

    // eslint-disable-next-line no-unused-vars
    for (const [index, action] of actions.entries()) {
      await new Promise(resolve => {
        const ele = document.querySelectorAll(action.eleSelector.selector)[
          action.eleSelector.index
        ]

        // 如果元素存在，则对元素赋值，并触发事件
        if (ele) {
          const name = action.eleName
          const value = formData[name]

          if (action.eleType !== 'input[type="button"]') {
            if ('input[type="radio"]|input[type="checkbox"]'.includes(action.eleType)) {
              ele.checked = true
            } else {
              ele.value = typeof value === 'undefined' ? '' : value
            }
          }
          ele.dispatchEvent(new Event(action.eventName))

          if (action.hasChangeDOM) {
            this.eventResolver = resolve

            // 如果持续没有返回，那么在固定时间后执行resolve，避免僵死
            setTimeout(() => {
              resolve && resolve(action)
            }, this.recoverTimeout)
          } else {
            resolve(action)
          }
        } else {
          // 如果没找到元素，那么直接resolve
          resolve(action)
        }
      })
    }

    // 恢复自定义的DOM
    this.#customDOM()

    // 恢复自定义表单数据
    if (formData) {
      this.#recoverFormData()
    }

    console.log('[Restore]表单复原完成')
  }

  /**
   * @description 恢复自定义内容
   * @memberof Restore
   */
  #customDOM() {
    const elements = this.form.querySelectorAll(`[${this.customDOMAttr}] [${this.customDOMAttrContent}]`)
    elements.forEach((ele, index) => {
      ele.innerHTML = this.store.customDOM[index] || ''
    })
  }

  /**
   * @description 恢复表单数据
   * @memberof Restore
   */
  #recoverFormData() {
    const { formData } = this.store

    setFormData(this.form, formData)
  }

  /**
   * @description 比对数据是否一致，给出提示
   * @memberof Restore
   */
  #compareFormData() {
    const currentFormData = getFormData(this.form)
    const previousFormData = this.store.formData
    const result = compareObject(previousFormData, currentFormData)
    let msg = '部分数据还原有误：\n'

    if (result.length) {
      result.forEach(item => {
        msg += `字段名：${item.name}, 原始值：${item.oldValue}，当前值：${item.newValue}\n`
      })
      alert(msg)
    }
  }

  /**
   * @description 暂存表单
   * @memberof Restore
   */
  holdForm() {
    this.#filterSameAction()

    const store = {
      actions: this.userActions,
      formData: getFormData(this.form),
      customDOM: getCustomDOM(this.form, this.customDOMAttr, this.customDOMAttrContent),
    }

    // 存储到localStorage
    localStorage.setItem('form-restore', JSON.stringify(store))

    return this
  }

  /**
   * @description 恢复表单
   * @memberof Restore
   */
  recoverForm() {
    let store

    try {
      store = JSON.parse(localStorage.getItem('form-restore'))
    } catch (e) {
      console.error(e)
    }

    if (!store) {
      return this
    }

    this.store = store

    // 禁止window的行为
    disableWindowAction()

    // 监听DOM变化
    this.#listenDOMChange(true)

    // 按顺序触发事件
    store.actions &&
      this.#recoverEvent().then(() => {

        // 启用window的行为
        resumeWindowAction()

        // 比对数据是否一致，给出提示
        this.#compareFormData()
      })

    return this
  }

  /**
   * @description 启动监听，一般在from表单加载完后执行
   * @memberof Restore
   */
  init() {
    // 开始记录用户操作
    this.#record()

    return this
  }
}

export default Restore
