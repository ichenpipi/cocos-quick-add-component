const PackageUtil = require("../eazax/package-util");

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/**
 * 操作器
 */
const Operator = {

    /**
     * 组件列表缓存
     */
    caches: [],

    /**
     * 获取匹配的组件列表
     * @param {string} keyword 
     * @returns {Promise<{ name: string }[]>}
     */
    async getMatchComponents(keyword) {
        // 处理正则公式符号
        const components = keyword.split('');
        for (let i = 0, l = components.length; i < l; i++) {
            if (/[*.?+$^()\[\]{}|\\\/]/.test(components[i])) {
                components[i] = '\\' + components[i];
            }
        }
        // 正则匹配
        // - (.*)：每个关键字之间可以有任意个字符；
        // - (?)：懒惰模式，匹配尽可能少的字符；
        // - (i)：不区分大小写；
        const pattern = components.join('.*?'),
            regExp = new RegExp(pattern, 'i');
        // 下面这行正则插入很炫酷，但是性能不好，耗时接近 split + join 的 10 倍
        // const pattern = keyword.replace(/(?<=.)(.)/g, '.*$1');
        // 查找并匹配
        const caches = Operator.caches,
            results = [];
        if (caches.length === 0) {
            await Operator.collect();
        }
        if (caches) {
            // 从缓存中查找
            for (let i = 0, l = caches.length; i < l; i++) {
                const name = caches[i],
                    match = name.match(regExp);
                if (match) {
                    // 相似度
                    const similarity = match[0].length;
                    results.push({ name, similarity });
                }
            }
            // 排序（similarity 越小，匹配的长度越短，匹配度越高）
            results.sort((a, b) => a.similarity - b.similarity);
        }
        return results;
    },

    /**
     * 获取组件列表
     * @returns {Promise<string[]>}
     */
    getComponents() {
        return new Promise(res => {
            // 调用场景脚本查找所有组件
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'get-components', (error, results) => {
                res(results);
            });
        });
    },

    /**
     * 添加组件
     * @returns {Promise<void>}
     */
    addComponent(uuids, name) {
        return new Promise(res => {
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-component', uuids, name, (error, result) => {
                res();
            });
        });
    },

    /**
     * 收集组件
     */
    async collect() {
        Operator.caches = await Operator.getComponents();
    },

    /**
     * 清除缓存
     */
    clear() {
        Operator.caches.length = 0;
    },

};

module.exports = Operator;
