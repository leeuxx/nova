// Build entry: re-exports Tiptap APIs. Run via `npm run build` to produce
// src/main/resources/public/js/lib/tiptap.mjs (esbuild bundle).

import { Extension } from '@tiptap/core'

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: function (element) { return element.style.fontSize },
            renderHTML: function (attributes) {
              if (!attributes.fontSize) return {}
              return { style: 'font-size: ' + attributes.fontSize }
            }
          }
        }
      }
    ]
  },
  addCommands() {
    return {
      setFontSize: function (fontSize) {
        return function (ctx) { return ctx.chain().setMark('textStyle', { fontSize: fontSize }).run() }
      },
      unsetFontSize: function () {
        return function (ctx) { return ctx.chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run() }
      }
    }
  }
})

export { Extension } from '@tiptap/core'
export { Editor } from '@tiptap/core'
export { StarterKit } from '@tiptap/starter-kit'
export { Underline } from '@tiptap/extension-underline'
export { Link } from '@tiptap/extension-link'
export { Placeholder } from '@tiptap/extension-placeholder'
export { TextStyle } from '@tiptap/extension-text-style'
export { TextAlign } from '@tiptap/extension-text-align'
export { FontFamily } from '@tiptap/extension-font-family'
export { FontSize }
