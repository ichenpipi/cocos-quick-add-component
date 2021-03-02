module.exports = {

    /**
     * 获取匹配关键字的组件
     * @param {any} event 
     * @param {string} keyword 关键字
     */
    'match-keyword': function (event, keyword) {
        // 模糊搜索，不区分大小写
        keyword = keyword.toLowerCase();
        // 获取匹配的组件列表
        const names = this.getMatchComponents(keyword);
        // 返回结果给主进程
        event.reply(null, names);
    },

    /**
     * 添加组件
     * @param {any} event 
     * @param {{uuids: string[]; name: string}} data 
     */
    'add-component': function (event, data) {
        // 获取组件 id
        const classId = this.getComponentId(data.name);
        // 添加组件到节点
        Editor.Ipc.sendToPanel('scene', 'scene:add-component', data.uuids, classId);
        event.reply(null);
    },

    /**
     * 获取匹配关键字的组件
     * @param {string} keyword 
     * @returns {string[]}
     */
    getMatchComponents(keyword) {
        // 组件菜单数据
        const items = cc._componentMenuItems;
        // 组件名列表
        let names = items.map((item) => cc.js.getClassName(item.component));
        // 过滤名称
        names = names.filter((name) => name.toLowerCase().includes(keyword));
        return names;
    },

    /**
     * 获取组件 id
     * @param {string} name 
     * @returns {string}
     */
    getComponentId(name) {
        const items = cc._componentMenuItems;
        for (let i = 0, l = items.length; i < l; i++) {
            const component = items[i].component;
            if (cc.js.getClassName(component) === name) {
                return cc.js._getClassId(component);
            }
        }
    },

};
