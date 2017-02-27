const path = require('path')
const fs = require('fs')
const hljs = require('highlight.js')

function getHighlightCode(str, style) {
    const prefix = '<pre><code class="hljs ' + style + '">'
    const postfix = '</code></pre>'

    return prefix + hljs.highlightAuto(str).value + postfix
}

function getImportCodeString(IDentifier, pathStr, type) {
    let rq = ''
    if (type === 'commonjs') {
        rq = 'require("' + pathStr + '")'
        if (IDentifier) {
            rq = 'const ' + IDentifier + '=' + rq
        }
    } else {
        rq = '"' + pathStr + '"'
        if (IDentifier) {
            rq = IDentifier + ' from ' + rq
        }

        rq = 'import ' + rq;
    }

    return rq + ';'
}

// 允许包含嵌套的 script 标签和 template 标签
const regScriptContent = /<script[^>]*>[\s\S]*(?=<\/script>)<\/script>/i
const regTemplateContent = /<template[^>]*>[\s\S]*(?=<\/template>)<\/template>/i
const regStyleContent = /<style[^>]*>[\s\S]*(?=<\/style>)<\/style>/i

const uuid = 'vsl_' + (+new Date()) + '_'

module.exports = function (source) {
    if (!source) return source

    this.cacheable()

    // 配置
    const query = Object.assign({}, this.query, {
        mode: 'es6', // 目前只支持倒入 es6 模式
        templateSign: '__inline_template',
        scriptSign: '__inline_script',
        highlightStyle: 'default'
    })
    const mode = query.mode
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
            const rp = path.resolve(path.dirname(resourcePath), src)
            const code = fs.readFileSync(rp, 'utf-8')
            const tag = uuid + addNum++;

            items.push({
                tag,
                src
            })

            this.addDependency(rp);

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
    // 导入 highlight.js 样式
    importCode += getImportCodeString('', 'highlight.js/styles/' + highlightStyle + '.css', mode)
    // 导入组件
    importCode += items
        .map(item => getImportCodeString(item.tag, item.src, mode))
        .join('\n')

    scriptSource = scriptSource
        .replace(/<script[^>]*>/, match => match + importCode)
        .replace(regScriptSign, match => '{' + items.map(item => item.tag).join(',') + '}')

    source = source
        .replace(regScriptContent, scriptSource)
        .replace(regTemplateContent, templateSource)

    return source
}