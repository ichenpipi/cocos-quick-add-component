const MainEvent = require('../eazax/main-event');
const EditorMainKit = require('../eazax/editor-main-kit');
const { checkUpdate, print, translate } = require('../eazax/editor-main-util');
const { openRepository } = require('../eazax/package-util');
const ConfigManager = require('../common/config-manager');
const Operator = require('./operator');
const PanelManager = require('./panel-manager');

/**
 * 生命周期：加载
 */
function load() {
    // 监听事件
    EditorMainKit.register();
    MainEvent.on('match', onMatchEvent);
    MainEvent.on('add', onAddEvent);
}

/**
 * 生命周期：卸载
 */
function unload() {
    // 关闭搜索栏
    PanelManager.closeSearchBar();
    // 取消事件监听
    EditorMainKit.unregister();
    MainEvent.removeAllListeners('match');
    MainEvent.removeAllListeners('add');
}

/**
 * （渲染进程）关键词匹配事件回调
 * @param {Electron.IpcMainEvent} event 
 * @param {string} keyword 关键词
 */
async function onMatchEvent(event, keyword) {
    // 匹配结果
    const results = await Operator.getMatchComponents(keyword);
    // 返回结果给渲染进程
    if (event.reply) {
        MainEvent.reply(event, 'match-reply', results);
    } else {
        // 兼容 Electron 4.x 及以下版本
        MainEvent.send(event.sender, 'match-reply', results);
    }
}

/**
 * （渲染进程）添加事件回调
 * @param {Electron.IpcMainEvent} event 
 * @param {string} name 名称
 */
function onAddEvent(event, name) {
    const uuids = getSelectedNodeUuids();
    if (uuids.length > 0) {
        Operator.addComponent(uuids, name);
    } else {
        print('log', translate('noSelected'));
    }
    // 关闭搜索栏
    PanelManager.closeSearchBar();
}

/**
 * 打开搜索栏
 */
function openSearchBar() {
    const uuids = getSelectedNodeUuids();
    if (uuids.length === 0) {
        print('log', translate('noSelected'));
        return;
    }
    // 打开
    const options = {
        /** 打开前 */
        onBeforeOpen: async () => {
            // 收集项目中的组件
            await Operator.collect();
            // 发消息通知渲染进程（搜索栏）
            if (PanelManager.search) {
                const webContents = PanelManager.search.webContents;
                MainEvent.send(webContents, 'data-update');
            }
        },
        /** 关闭后 */
        onClosed: () => {
            // 清除缓存
            Operator.clear();
        },
    };
    PanelManager.openSearchBar(options);
}

/**
 * 当前选中的节点 Uuid
 * @returns {string[]} 
 */
function getSelectedNodeUuids() {
    return Editor.Selection.curSelection('node');
}

module.exports = {

    /**
     * 扩展消息
     */
    messages: {

        /**
         * 打开搜索栏
         * @param {*} event 
         */
        'open-search-bar'(event) {
            openSearchBar();
        },

        /**
         * 打开设置面板
         * @param {*} event 
         */
        'open-settings-panel'(event) {
            PanelManager.openSettingsPanel();
        },

        /**
         * 检查更新
         * @param {*} event 
         */
        'menu-check-update'(event) {
            checkUpdate(true);
        },

        /**
         * 版本
         * @param {*} event 
         */
        'menu-version'(event) {
            openRepository();
        },

        /**
         * 场景面板加载完成后
         * @param {*} event 
         */
        'scene:ready'(event) {
            // 自动检查更新
            const config = ConfigManager.get();
            if (config.autoCheckUpdate) {
                checkUpdate(false);
            }
        },

    },

    load,

    unload,

};
