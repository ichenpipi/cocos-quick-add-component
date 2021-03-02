const ConfigManager = require('./config-manager');
const { BrowserWindow, ipcMain } = require('electron');

/** 包名 */
const PACKAGE_NAME = 'ccc-quick-add-component';

module.exports = {

  /** 搜索栏实例 */
  searchBar: null,

  messages: {

    /**
     * 打开搜索面板
     */
    'open-search-panel'() {
      if (this.getSelectedNodeUuids().length === 0) {
        Editor.log('[QAC]', '请先选中需要添加组件的节点');
        return;
      }
      this.showSearchBar();
    },

    /**
     * 打开设置面板
     */
    'open-setting-panel'() {
      Editor.Panel.open(`${PACKAGE_NAME}.setting`);
    },

    /**
     * 保存配置
     * @param {any} event 
     * @param {any} config 
     */
    'save-config'(event, config) {
      ConfigManager.save(config);
      event.reply(null, true);
    },

    /**
     * 读取配置
     * @param {any} event 
     */
    'read-config'(event) {
      const config = ConfigManager.read(true);
      event.reply(null, config);
    }

  },

  load() {
    // 监听获取语言事件
    ipcMain.on(`${PACKAGE_NAME}:get-lang`, this.onGetLangEvent.bind(this));
    // 监听关键词搜索事件
    ipcMain.on(`${PACKAGE_NAME}:match-keyword`, this.onMatchKeywordEvent.bind(this));
    // 监听添加组件事件
    ipcMain.on(`${PACKAGE_NAME}:add-component`, this.onAddComponentEvent.bind(this));
    // 监听关闭事件
    ipcMain.on(`${PACKAGE_NAME}:close`, this.onCloseEvent.bind(this));
  },

  unload() {
    // 取消事件监听
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:get-lang`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:match-keyword`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:add-component`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:close`);
  },

  /**
   * （渲染进程）获取语言事件回调
   * @param {*} event 
   */
  onGetLangEvent(event) {
    event.reply(`${PACKAGE_NAME}:get-lang-reply`, Editor.lang);
  },

  /**
   * （渲染进程）关键词匹配事件回调
   * @param {*} event 
   * @param {string} keyword 
   */
  onMatchKeywordEvent(event, keyword) {
    // 调用场景脚本查找匹配关键字的组件
    Editor.Scene.callSceneScript(PACKAGE_NAME, 'match-keyword', keyword, (error, names) => {
      // 返回结果给渲染进程
      event.reply(`${PACKAGE_NAME}:match-keyword-reply`, names);
    });
  },

  /**
   * （渲染进程）添加组件事件回调
   * @param {*} event 
   * @param {string} name 组件名称
   */
  onAddComponentEvent(event, name) {
    // 获取当前选中节点 uuid
    const uuids = this.getSelectedNodeUuids();
    if (uuids.length === 0) {
      Editor.log('[QAC]', '请选中需要添加组件的节点');
      return;
    }
    // 调用场景脚本添加组件
    const data = { uuids, name };
    Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-component', data, (error) => {
      event.reply(`${PACKAGE_NAME}:add-component-reply`);
    });
  },

  /**
   * （渲染进程）关闭事件回调
   * @param {*} event 
   */
  onCloseEvent() {
    this.hideSearchBar();
  },

  /**
   * 展示搜索栏
   */
  showSearchBar() {
    // 已打开则关闭
    if (this.searchBar) {
      this.hideSearchBar();
      return;
    }
    // 创建窗口
    const win = this.searchBar = new BrowserWindow({
      width: 500,
      height: 600,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: true,
      opacity: 0.95,
      backgroundColor: '#00000000',
      hasShadow: false,
      show: false,
      webPreferences: {
        nodeIntegration: true
      },
    });
    // 加载页面
    win.loadURL(`file://${__dirname}/search/index.html`);
    // 调试用的 devtools
    // win.webContents.openDevTools({ mode: 'bottom' });
    // 监听 ESC 按键（隐藏搜索栏）
    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Escape') this.hideSearchBar();
    });
    // 失焦后自动隐藏
    win.on('blur', () => this.hideSearchBar());
    // 就绪后展示（避免闪烁）
    win.on('ready-to-show', () => win.show());
  },

  /**
   * 隐藏搜索栏
   */
  hideSearchBar() {
    if (!this.searchBar) return;
    this.searchBar.close();
    this.searchBar = null;
  },

  /**
   * 当前选中的节点 UUID
   */
  getSelectedNodeUuids() {
    // curGlobalActivate 只能获取单个选择
    // Editor.Selection.curGlobalActivate();
    return Editor.Selection.curSelection('node');
  },

}
