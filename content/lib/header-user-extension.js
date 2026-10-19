'use strict'

// Resolves the header username ("You are ...") at build time.
//
// AsciiDoc attribute refs ({user}) only resolve inside page content — not in
// antora.yml values or Handlebars partials — so header-content.hbs rendered
// the literal antora.yml `page-user: "{user}"` string. The showroom deployer's
// passthrough fills antora.yml component-level attributes, and attribute-ref
// resolution during page content conversion is where the value reliably lands:
// each page's post-conversion `attrs.user` holds the resolved username, so
// this extension copies it into each page's page-user attribute and the
// existing partial renders it unchanged. When no resolved username is
// available (e.g. a local build with a literal `{user}` placeholder), the
// placeholder is dropped so the header line is simply hidden.
//
// Also resolves the literal `{openshift_cluster_ingress_domain}` placeholder
// in the antora.yml page-links list, which attribute-ref resolution doesn't
// reach (nested list structures); local builds without the attribute are left
// as-is.

module.exports.register = function () {
  // NOTE: documentsConverted, not pagesComposed — pagesComposed fires after
  // the page composer has already rendered the HTML, so attribute mutations
  // there are too late.
  this.on('documentsConverted', ({ contentCatalog }) => {
    contentCatalog.getPages().forEach((page) => {
      const attrs = page.asciidoc && page.asciidoc.attributes
      if (!attrs) return
      // attrs.user (post-conversion page attribute) wins; a literal '{user}'
      // placeholder counts as absent so the header line is hidden.
      const resolved = attrs.user && attrs.user !== '{user}'
        ? attrs.user
        : attrs['page-user'] && attrs['page-user'] !== '{user}' ? attrs['page-user'] : ''
      attrs['page-user'] = resolved
      if (resolved) attrs.user = resolved
      // page-links list entries stay unresolved post-conversion; substitute
      // the domain placeholder from the component-level attribute.
      const domain = attrs.openshift_cluster_ingress_domain
      if (Array.isArray(attrs['page-links']) && domain) {
        attrs['page-links'] = attrs['page-links'].map((l) =>
          l && typeof l.url === 'string'
            ? { ...l, url: l.url.replaceAll('{openshift_cluster_ingress_domain}', domain) }
            : l
        )
      }
    })
  })
}
