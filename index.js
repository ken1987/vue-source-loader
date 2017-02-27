const path = require('path')
const fs = require('fs')
const hljs = require('highlight.js')

function getHighlightCode(str, style) {
    const prefix = '<pre><code class="hljs ' + style + '">'
    const postfix = '</code></pre>'

    return prefix + hljs.highlightAuto(str).value + postfix
}

// 允许包含嵌套的 script 标签和 template 标签
const regScriptContent = /<script[^>]*>[\s\S]*(?=<\/script>)<\/script>/i
const regTemplateContent = /<template[^>]*>[\s\S]*(?=<\/template>)<\/template>/i
const regStyleContent = /<style[^>]*>[\s\S]*(?=<\/style>)<\/style>/i

const uuid = 'vsl_' + (+new Date()) + '_'

module.exports = function (source) {
    if (!source) return source
    // 配置
    const query = Object.assign({}, this.query, {
        mode: 'es6', // 目前只支持倒入 es6 模式
        templateSign: '__inline_template',
        scriptSign: '__inline_script',
        highlightStyle: 'default'
    })
    const templateSign = query.templateSign
    const scriptSign = query.scriptSign
    const highlightStyle = query.highlightStyle
    const resourcePath = this.resourcePath
    const items = []

    // 查找需要插入的 .vue 资源
    let templateSource = source.match(regTemplateContent)

    if (!templateSource) return source
    const regTemplateSign = new RegExp(templateSign + '\\((.*?)\\)', 'g')
    let addNum = 1
    templateSource = templateSource[0].replace(regTemplateSign, (match, src) => {
        try {
            const code = fs.readFileSync(
                path.resolve(path.dirname(resourcePath), src),
                'utf-8'
            )
            const tag = uuid + addNum++;

            items.push({
                tag,
                src
            })

            return '<' + tag + '></' + tag + '>' + getHighlightCode(code, highlightStyle)
        } catch (e) {
            console.error(e)
            return match
        }
    })


    // 生成 script 代码
    const regScriptSign = new RegExp('global\\.' + scriptSign, 'g')
    let scriptSource = source.match(regScriptContent)
    scriptSource = scriptSource ? scriptSource[0] : '<script></script>'
    let importCode = ''
    importCode += 'import \'highlight.js/styles/' + highlightStyle + '.css\';' // 导入 highlight.js 样式
    importCode += items.map(item => 'import ' + item.tag + ' from \'' + item.src + '\';').join('\n') // 导入组件

    scriptSource = scriptSource
        .replace(/<script[^>]*>/, match => match + importCode)
        .replace(regScriptSign, match => '{' + items.map(item => item.tag).join(',') + '}')

    source = source.replace(regScriptContent, scriptSource).replace(regTemplateContent, templateSource)

    return source
}