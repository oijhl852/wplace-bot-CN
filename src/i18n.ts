/**
 * i18n 国际化模块
 * 支持 en / zh-CN 切换，偏好保存在 localStorage.wbot-lang
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { WPlaceBot } from './bot'
const locales: Record<string, Record<string, string | Function>> = {
  en: {
    // ── Widget ──
    'widget.title': 'wplace-bot',
    'widget.draw': 'Draw',
    'widget.addImage': 'Add image',
    'widget.strategy': 'Strategy',
    'widget.strategy.sequential': 'Sequential',
    'widget.strategy.all': 'All',
    'widget.strategy.percentage': 'Percentage',
    'widget.progress': (d: number, t: number, p: number, h: number) =>
      `${d}/${t} ${p}% est: ${h}h`,
    'widget.status.initializing': 'Initializing',
    'widget.status.drawing': 'Drawing',
    'widget.status.initDraw': 'Init draw',
    'widget.status.readMap': (n: number, t: number) => `Read map [${n}/${t}]`,
    'widget.status.unfocus': 'Unfocus window',
    'widget.status.waiting': (name: string) => `Waiting ${name}`,
    'widget.status.addImage': 'Adding image',
    'widget.langToggle': 'EN/中',

    // ── Image panel ──
    'image.opacity': 'Opacity',
    'image.brightness': 'Brightness',
    'image.strategy': 'Strategy',
    'image.strategy.random': 'Random',
    'image.strategy.down': 'Down',
    'image.strategy.up': 'Up',
    'image.strategy.left': 'Left',
    'image.strategy.right': 'Right',
    'image.strategy.spiralOut': 'Spiral out',
    'image.strategy.spiralIn': 'Spiral in',
    'image.resetSize': 'Reset size',
    'image.pixels': 'pixels',
    'image.coord': 'Coord',
    'image.crop': 'Crop',
    'image.crop.apply': 'Apply',
    'image.crop.left': 'L',
    'image.crop.right': 'R',
    'image.crop.top': 'T',
    'image.crop.bottom': 'B',
    'image.drawTransparent': 'Erase transparent pixels',
    'image.drawColorsInOrder': 'Draw colors in order',
    'image.progress': (d: number, t: number, p: number, h: number) =>
      `${d}/${t} ${p}% est: ${h}h`,

    // ── Errors ──
    'error.notInitialized': '❌ Not initialized',
    'error.noImage': '❌ No image selected',

    // ── Tooltips ──
    'image.hide': 'Hide / Show',
    'image.export': 'Export',
    'image.lock': 'Lock / Unlock',
    'image.delete': 'Delete',

    // ── WaitForElement ──
    'wait.login': 'login',
    'wait.pixelCount': 'pixel count',
    'wait.canvas': 'canvas',
  },

  'zh-CN': {
    'widget.title': 'wplace-bot-CN',
    'widget.draw': '绘制',
    'widget.addImage': '添加图片',
    'widget.strategy': '策略',
    'widget.strategy.sequential': '顺序',
    'widget.strategy.all': '全部',
    'widget.strategy.percentage': '百分比',
    'widget.progress': (d: number, t: number, p: number, h: number) =>
      `${d}/${t} ${p}% 预计: ${h}小时`,
    'widget.status.initializing': '初始化中',
    'widget.status.drawing': '绘制中',
    'widget.status.initDraw': '初始化绘制',
    'widget.status.readMap': (n: number, t: number) => `读取地图 [${n}/${t}]`,
    'widget.status.unfocus': '取消聚焦窗口',
    'widget.status.waiting': (name: string) => `等待 ${name}`,
    'widget.status.addImage': '添加图片中',
    'widget.langToggle': '中/EN',

    'image.opacity': '不透明度',
    'image.brightness': '亮度',
    'image.strategy': '策略',
    'image.strategy.random': '随机',
    'image.strategy.down': '向下',
    'image.strategy.up': '向上',
    'image.strategy.left': '向左',
    'image.strategy.right': '向右',
    'image.strategy.spiralOut': '向外螺旋',
    'image.strategy.spiralIn': '向内螺旋',
    'image.resetSize': '重置大小',
    'image.pixels': '像素',
    'image.coord': '坐标',
    'image.crop': '裁切',
    'image.crop.apply': '执行',
    'image.crop.left': '左',
    'image.crop.right': '右',
    'image.crop.top': '上',
    'image.crop.bottom': '下',
    'image.drawTransparent': '擦除透明像素',
    'image.drawColorsInOrder': '按顺序绘制颜色',
    'image.progress': (d: number, t: number, p: number, h: number) =>
      `${d}/${t} ${p}% 预计: ${h}小时`,

    'error.notInitialized': '❌ 未初始化',
    'error.noImage': '❌ 未选择图片',

    'image.hide': '隐藏 / 显示',
    'image.export': '导出',
    'image.lock': '锁定 / 解锁',
    'image.delete': '删除',

    'wait.login': '登录',
    'wait.pixelCount': 'pixel count',
    'wait.canvas': '画布',
  },
}

// ─── 状态 ─────────────────────────────────────────────────────
const STORAGE_KEY = 'wbot-lang'
let currentLang: string =
  localStorage.getItem(STORAGE_KEY) ?? detectBrowserLang()

function detectBrowserLang(): string {
  const nav = (globalThis as unknown as { navigator?: { language?: string } }).navigator
  const lang = nav?.language ?? ''
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

// ─── 核心翻译函数 ──────────────────────────────────────────
/**
 * 翻译函数，支持点分隔 key 和参数替换
 * t('widget.draw') → 'Draw'
 * t('widget.progress', 10, 100, 10, 2) → '10/100 10% est: 2h'
 */
export function t(key: string, ...args: unknown[]): string {
  const dict = locales[currentLang]
  if (!dict) return key
  const entry = dict[key]
  if (entry === undefined) return key
  if (typeof entry === 'function') {
    return (entry as Function)(...args)
  }
  return entry as string
}

/** 获取当前语言 */
export function getLang(): string {
  return currentLang
}

/** 切换语言并刷新所有 UI */
export function toggleLang(): void {
  currentLang = currentLang === 'en' ? 'zh-CN' : 'en'
  localStorage.setItem(STORAGE_KEY, currentLang)
  refreshAll()
}

/** 初始化（在 WPlaceBot constructor 中调用）*/
export function initI18n(bot: WPlaceBot): void {
  translateElement(bot.widget.element)
  for (const img of bot.images) {
    translateElement(img.element)
  }
}

// ─── DOM 翻译 ──────────────────────────────────────────────

/**
 * 遍历 element 内所有带 i18n 属性的元素，设置对应文本
 *  - data-i18n           → 设置 textContent
 *  - data-i18n-title     → 设置 title 属性
 *  - data-i18n-placeholder → 设置 input.placeholder
 */
export function translateElement(element: HTMLElement): void {
  const dict = locales[currentLang]
  if (!dict) return

  // ① data-i18n → textContent
  const textNodes = element.querySelectorAll<HTMLElement>('[data-i18n]')
  for (const el of textNodes) {
    const key = el.getAttribute('data-i18n')
    if (!key) continue
    const entry = dict[key]
    if (entry === undefined || typeof entry === 'function') continue
    el.textContent = entry as string
  }

  // ② data-i18n-title → title 属性
  const titleNodes = element.querySelectorAll<HTMLElement>('[data-i18n-title]')
  for (const el of titleNodes) {
    const key = el.getAttribute('data-i18n-title')
    if (!key) continue
    const entry = dict[key]
    if (entry === undefined || typeof entry === 'function') continue
    el.title = entry as string
  }

  // ③ data-i18n-placeholder → input.placeholder
  const placeholderNodes = element.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]')
  for (const el of placeholderNodes) {
    const key = el.getAttribute('data-i18n-placeholder')
    if (!key) continue
    const entry = dict[key]
    if (entry === undefined || typeof entry === 'function') continue
    el.placeholder = entry as string
  }
}

// ─── 刷新所有 UI ───────────────────────────────────────────
function refreshAll(): void {
  const wbot = (globalThis as unknown as { wbot?: WPlaceBot }).wbot
  if (!wbot) return

  translateElement(wbot.widget.element)
  wbot.widget.update()

  for (const img of wbot.images) {
    translateElement(img.element)
    img.update()
  }
}
