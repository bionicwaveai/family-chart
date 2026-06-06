
export default function () {
  const routes = [
  [
    "1-basic-tree",
    "/examples/htmls/1-basic-tree"
  ],
  [
    "2-basic-tree-aristotle",
    "/examples/htmls/2-basic-tree-aristotle"
  ],
  [
    "3-custom-tree-card",
    "/examples/htmls/3-custom-tree-card"
  ],
  [
    "4-custom-main-node",
    "/examples/htmls/4-custom-main-node"
  ],
  [
    "5-custom-text-display",
    "/examples/htmls/5-custom-text-display"
  ],
  [
    "6-html-cards",
    "/examples/htmls/6-html-cards"
  ],
  [
    "7-custom-elements-and-actions",
    "/examples/htmls/7-custom-elements-and-actions"
  ],
  [
    "8-zoom-to-card",
    "/examples/htmls/8-zoom-to-card"
  ],
  [
    "9-big-tree",
    "/examples/htmls/9-big-tree"
  ],
  [
    "11-html-card-styling",
    "/examples/htmls/11-html-card-styling"
  ],
  [
    "12-single-parent",
    "/examples/htmls/12-single-parent"
  ],
  [
    "13-horizontal-tree",
    "/examples/htmls/13-horizontal-tree"
  ],
  [
    "14-sort-children-function",
    "/examples/htmls/14-sort-children-function"
  ],
  [
    "15-trim-tree",
    "/examples/htmls/15-trim-tree"
  ],
  [
    "v2/1-basic-tree",
    "/examples/htmls/v2/1-basic-tree"
  ],
  [
    "v2/2-basic-tree-aristotle",
    "/examples/htmls/v2/2-basic-tree-aristotle"
  ],
  [
    "v2/3-custom-tree-card",
    "/examples/htmls/v2/3-custom-tree-card"
  ],
  [
    "v2/4-custom-main-node",
    "/examples/htmls/v2/4-custom-main-node"
  ],
  [
    "v2/5-custom-text-display",
    "/examples/htmls/v2/5-custom-text-display"
  ],
  [
    "v2/6-svg-cards",
    "/examples/htmls/v2/6-svg-cards"
  ],
  [
    "v2/7-svg-cards-edit",
    "/examples/htmls/v2/7-svg-cards-edit"
  ],
  [
    "v2/8-custom-elements-and-actions",
    "/examples/htmls/v2/8-custom-elements-and-actions"
  ],
  [
    "v2/9-zoom-to-card",
    "/examples/htmls/v2/9-zoom-to-card"
  ],
  [
    "v2/10-big-tree",
    "/examples/htmls/v2/10-big-tree"
  ],
  [
    "v2/11-card-styling",
    "/examples/htmls/v2/11-card-styling"
  ],
  [
    "v2/12-single-parent",
    "/examples/htmls/v2/12-single-parent"
  ],
  [
    "v2/13-horizontal-tree",
    "/examples/htmls/v2/13-horizontal-tree"
  ],
  [
    "v2/14-sort-children-function",
    "/examples/htmls/v2/14-sort-children-function"
  ],
  [
    "v2/15-trim-tree",
    "/examples/htmls/v2/15-trim-tree"
  ],
  [
    "v2/16-default-card-icons",
    "/examples/htmls/v2/16-default-card-icons"
  ],
  [
    "v2/17-edit-tree",
    "/examples/htmls/v2/17-edit-tree"
  ],
  [
    "v2/18-edit-tree-get-data-on-change",
    "/examples/htmls/v2/18-edit-tree-get-data-on-change"
  ],
  [
    "v2/19-family-tree-custom-fields",
    "/examples/htmls/v2/19-family-tree-custom-fields"
  ]
]

  injectGalleryStyles()

  const rootCont = document.createElement('div')
  rootCont.className = 'f3-gallery-root'
  document.body.appendChild(rootCont)

  // Far-left icon rail. The menu is auto-hidden by default; clicking an icon
  // pops open its panel. Add more entries to `menus` to get more rail icons,
  // each opening its own left-side menu.
  const rail = document.createElement('div')
  rail.className = 'f3-gallery-rail'
  rootCont.appendChild(rail)

  // Collapsible panel that holds the active menu's content.
  const panel = document.createElement('div')
  panel.className = 'f3-gallery-panel'
  const panelInner = document.createElement('div')
  panelInner.className = 'f3-gallery-panel-inner'
  panel.appendChild(panelInner)
  rootCont.appendChild(panel)

  const cont = document.querySelector('#FamilyChart')
  cont.style.height = '90vh'
  cont.classList.add('f3-gallery-chart')
  rootCont.appendChild(cont)

  // Menu registry — extensible. Each menu gets a rail icon and a panel view.
  const menus = [
    { id: 'examples', title: 'Examples', icon: GALLERY_ICONS.list, render: renderExamplesMenu },
  ]

  // Remember the open menu across page navigations (examples reload the page).
  // Defaults to closed (auto-hidden) on first visit.
  const STORAGE_KEY = 'f3-gallery-open-menu'
  let open_id = readOpenId()

  const rail_buttons = {}
  menus.forEach(menu => {
    const btn = document.createElement('button')
    btn.className = 'f3-gallery-rail-btn'
    btn.title = menu.title
    btn.setAttribute('aria-label', menu.title)
    btn.innerHTML = menu.icon
    btn.addEventListener('click', () => toggle(menu.id))
    rail.appendChild(btn)
    rail_buttons[menu.id] = btn
  })

  update()

  function toggle(id) {
    open_id = open_id === id ? null : id
    try { localStorage.setItem(STORAGE_KEY, open_id || '') } catch (e) { /* ignore */ }
    update()
  }

  function update() {
    const menu = menus.find(m => m.id === open_id)
    panelInner.innerHTML = ''
    if (menu) {
      const header = document.createElement('div')
      header.className = 'f3-gallery-panel-header'
      header.innerHTML = `<span>${menu.title}</span>`
      const close_btn = document.createElement('button')
      close_btn.className = 'f3-gallery-close'
      close_btn.innerHTML = '&times;'
      close_btn.title = 'Hide menu'
      close_btn.addEventListener('click', () => toggle(menu.id))
      header.appendChild(close_btn)
      panelInner.appendChild(header)
      panelInner.appendChild(menu.render())
    }
    panel.classList.toggle('open', !!menu)
    Object.keys(rail_buttons).forEach(id => rail_buttons[id].classList.toggle('active', id === open_id))
  }

  function renderExamplesMenu() {
    const current = document.querySelector('title') ? document.querySelector('title').textContent : ''
    const list = document.createElement('div')
    list.className = 'f3-gallery-list'
    list.innerHTML = routes.map(route => `
      <a class="f3-gallery-link${current === route[0] ? ' active' : ''}" href="${route[1]}">${route[0]}</a>
    `).join('')
    return list
  }

  function readOpenId() {
    let id = null
    try { id = localStorage.getItem(STORAGE_KEY) } catch (e) { /* ignore */ }
    if (!id || !menus.some(m => m.id === id)) return null
    return id
  }
}

const GALLERY_ICONS = {
  list: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>',
}

function injectGalleryStyles() {
  if (document.getElementById('f3-gallery-styles')) return
  const style = document.createElement('style')
  style.id = 'f3-gallery-styles'
  style.textContent = `
    .f3-gallery-root { display: flex; flex-direction: row; width: 100%; height: 100%; }
    .f3-gallery-rail {
      flex: 0 0 auto; width: 48px; height: 90vh; background: rgb(24,24,24);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding-top: 8px; z-index: 7;
    }
    .f3-gallery-rail-btn {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      background: transparent; color: #bbb; border: none; border-radius: 8px; cursor: pointer;
      transition: background .15s ease, color .15s ease;
    }
    .f3-gallery-rail-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .f3-gallery-rail-btn.active { background: #4CAF50; color: #fff; }
    .f3-gallery-panel {
      flex: 0 0 auto; width: 0; height: 90vh; background: rgb(33,33,33); color: #fff;
      overflow: hidden; transition: width .2s ease; border-right: 1px solid rgba(255,255,255,0.08);
    }
    .f3-gallery-panel.open { width: 280px; }
    .f3-gallery-panel-inner { width: 280px; height: 100%; overflow-y: auto; box-sizing: border-box; }
    .f3-gallery-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; font-weight: bold; position: sticky; top: 0;
      background: rgb(33,33,33); border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .f3-gallery-close { background: transparent; border: none; color: #bbb; font-size: 20px; line-height: 1; cursor: pointer; padding: 0 4px; }
    .f3-gallery-close:hover { color: #fff; }
    .f3-gallery-list { display: flex; flex-direction: column; }
    .f3-gallery-link { color: #fff; text-decoration: none; padding: 10px 14px; border-left: 3px solid transparent; }
    .f3-gallery-link:hover { background: rgb(66,66,66); }
    .f3-gallery-link.active { background: rgb(66,66,66); border-left-color: #4CAF50; }
    .f3-gallery-chart { flex: 1 1 0; min-width: 0; }
  `
  document.head.appendChild(style)
}
  