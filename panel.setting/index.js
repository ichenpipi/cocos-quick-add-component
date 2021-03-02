const Fs = require('fs');

/** 包名 */
const PACKAGE_NAME = 'ccc-quick-add-component';

Editor.Panel.extend({

  style: Fs.readFileSync(Editor.url(`packages://${PACKAGE_NAME}/panel.setting/index.css`), 'utf8'),

  template: Fs.readFileSync(Editor.url(`packages://${PACKAGE_NAME}/panel.setting/index.html`), 'utf8'),

  ready() {
    const app = new window.Vue({
      el: this.shadowRoot,

      data: {
        // 多语言文本
        titleLabel: Editor.T(`${PACKAGE_NAME}.setting`),
        selectLabel: Editor.T(`${PACKAGE_NAME}.select`),
        selectTooltipLabel: Editor.T(`${PACKAGE_NAME}.selectTooltip`),
        customLabel: Editor.T(`${PACKAGE_NAME}.custom`),
        customPlaceholderLabel: Editor.T(`${PACKAGE_NAME}.customPlaceholder`),
        customTooltipLabel: Editor.T(`${PACKAGE_NAME}.customTooltip`),
        referenceLabel: Editor.T(`${PACKAGE_NAME}.reference`),
        repositoryLabel: Editor.T(`${PACKAGE_NAME}.repository`),
        applyLabel: Editor.T(`${PACKAGE_NAME}.apply`),
        // 预设快捷键
        presets: [
          { key: 'custom', name: Editor.T(`${PACKAGE_NAME}.custom`) },
          { key: 'F1', name: 'F1' },
          { key: 'F2', name: 'F2' },
          { key: 'F3', name: 'F3' },
          { key: 'F4', name: 'F4' },
          { key: 'F5', name: 'F5' },
          { key: 'CmdOrCtrl+B', name: 'Cmd/Ctrl + B' },
          { key: 'CmdOrCtrl+N', name: 'Cmd/Ctrl + N' },
        ],
        // 设置
        select: 'F1',
        custom: '',
        // 状态
        isProcessing: false
      },

      methods: {

        /**
         * 选择变化回调
         * @param {*} event 
         */
        onSelectChange(event) {
          if (this.select !== 'custom') {
            this.custom = '';
          }
        },

        /**
         * 自定义输入框内容变化回调
         * @param {*} event 
         */
        onCustomChange(event) {
          if (this.select !== 'custom') {
            this.select = 'custom';
          }
        },

        /**
         * 应用设置
         * @param {*} event 
         */
        onApplyBtnClick(event) {
          if (this.isProcessing) return;
          // 配置
          const config = Object.create(null);
          if (this.select === 'custom') {
            const custom = this.custom;
            // 不可以使用双引号（避免 json 值中出现双引号而解析错误，导致插件加载失败）
            if (custom.includes('"')) {
              this.custom = this.custom.replace(/\"/g, '');
              Editor.warn('[QAC]', Editor.T(`${PACKAGE_NAME}.quoteError`));
              return;
            }
            // 输入是否有效
            if (custom === '') {
              Editor.warn('[QAC]', Editor.T(`${PACKAGE_NAME}.customError`));
              return;
            }
            config.hotkey = custom;
          } else {
            config.hotkey = this.select;
          }
          // 发消息给主进程保存配置
          this.isProcessing = true;
          Editor.Ipc.sendToMain(`${PACKAGE_NAME}:save-config`, config, (error) => {
            this.isProcessing = false;
          });
        },

        /**
         * 读取设置
         */
        readConfig() {
          Editor.Ipc.sendToMain(`${PACKAGE_NAME}:read-config`, (error, config) => {
            if (error || !config) return;
            const presets = this.presets,
              hotkey = config.hotkey;
            // 预设按键
            for (let i = 0, l = presets.length; i < l; i++) {
              if (presets[i].key === hotkey) {
                this.select = hotkey;
                this.custom = '';
                return;
              }
            }
            // 自定义按键
            this.select = 'custom';
            this.custom = hotkey;
          });
        },

      }
    });

    app.readConfig();

  }

});
