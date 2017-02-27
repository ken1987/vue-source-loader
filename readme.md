#  vue-source-loader

The src resource inline.

## bug

会被重复执行多次，好奇怪

## notes

* node >= 6.0.0
* npm >= 3.0.0
* webpack >= 2.0.0

## install

```shell
npm i vue-source-loader
```

## webpack 2.x config

```js
const options = {
    mode：'es6',                       // 输出的 javascript 模块加载方式。目前只支持倒入 es6 模式，即：import
    templateSign: '__inline_template', // 模板标记，默认值 `__inline_template`
    scriptSign: '__inline_script',     // javascript 标记，默认值 `__inline_script`
    highlightStyle: 'default'          // 代码高亮显示样式，默认值 `default`
}

module.exports = {
    module: {
        rules: [
            {
                test: /\.demo\.vue$/,
                loader: 'vue-source-loader',
                enforce: 'pre',
                options
            }
        ]
    }
}
```

## usage

* 在 `template` 标签中插入模块地址

    > 规则：`templateSign + '(' + filePath + ')'`

```html
<template>
    <div>
        __inline_template(path/to/demo.vue)
    </div>
</template>
```

* 在 `script` 标签中插入对导入的模块的引用

    > 规则：`'global.' + templateSign`
    > 说明：`global.` 前缀是为了在没有插件的时候代码能正常执行

```html
<script>
    const components = global.__inline_script
</script>
```

* 输入结果

```html
<template>
    <div>
        <components_tag></components_tag>
        <pre><code class="hljs default">...</code></pre>
    </div>
</template>
<script>
    import 'highlight.js/styles/default.css';
    import components_tag from 'path/to/demo.vue';
    const components = {components_tag}
    // ...
</script>
```
