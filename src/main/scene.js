module.exports = {

    /**
     * 获取项目中的组件
     * @param {*} event 
     */
    'get-components': function (event) {
        const components = getComponents();
        event.reply(null, components);
    },

    /**
     * 添加组件到指定节点
     * @param {*} event 
     * @param {string[]} uuids 节点 Uuid
     * @param {string} name 组件名
     */
    'add-component': function (event, uuids, name) {
        const componentId = getComponentId(name);
        if (!componentId) {
            event.reply(false);
            return;
        }
        Editor.Ipc.sendToPanel('scene', 'scene:add-component', uuids, componentId);
        event.reply(true);
    },

};

/**
 * 获取项目中的组件
 * @returns {string[]}
 */
function getComponents() {
    const items = cc._componentMenuItems,
        components = items.map(v => cc.js.getClassName(v.component));
    return components;
}

/**
 * 获取组件 id
 * @param {string} name 组件名称
 * @returns {string}
 */
function getComponentId(name) {
    // const items = cc._componentMenuItems;
    // for (let i = 0, l = items.length; i < l; i++) {
    //     const { component } = items[i];
    //     if (cc.js.getClassName(component) === name) {
    //         return cc.js._getClassId(component);
    //     }
    // }
    // return null;
    const component = cc.js.getClassByName(name);
    if (component) {
        return cc.js._getClassId(component);
    }
    return null;
}
