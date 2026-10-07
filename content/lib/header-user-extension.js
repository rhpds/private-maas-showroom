'use strict'

// Resolves the header username ("You are ...") at build time.
//
// AsciiDoc attribute refs ({user}) only resolve inside page content — not in
// antora.yml values or Handlebars partials — so header-content.hbs rendered
// the literal antora.yml `page-user: "{user}"` string. This extension copies
// the resolved passthrough `user` attribute (injected by the showroom
// deployer as a playbook attribute, which is how page content resolves it)
// into each page's page-user attribute so the existing partial renders it
// unchanged. When the attribute is absent (e.g. a local build), the literal
// placeholder is dropped so the header line is simply hidden.

module.exports.register = function () {
  let user
  this.once('playbookBuilt', ({ playbook }) => {
    user = playbook.asciidoc.attributes.user
  })
  // NOTE: documentsConverted, not pagesComposed — pagesComposed fires after
  // the page composer has already rendered the HTML, so attribute mutations
  // there are too late.
  this.on('documentsConverted', ({ contentCatalog }) => {
    contentCatalog.getPages().forEach((page) => {
      const attrs = page.asciidoc && page.asciidoc.attributes
      if (!attrs) return
      const resolved = user || (attrs.user === '{user}' || attrs['page-user'] === '{user}' ? '' : (attrs.user || attrs['page-user']))
      if (resolved === undefined) return
      attrs['page-user'] = resolved
      if (resolved) attrs.user = resolved
    })
  })
}
