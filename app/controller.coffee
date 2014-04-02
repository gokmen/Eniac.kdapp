class EniacController extends AppController

  COFFEE = "//cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js"
  
  constructor:(options = {}, data)->

    options.view    = new EniacMainView
    options.appInfo =
      name : "Eniac"
      type : "application"

    super options, data
    
    @getView().once 'viewAppended', @bound 'bindEvents'

  bindEvents:(view = @getView())->
    
    view.on 'createMenuItemClicked',  @bound 'createNewApp'
    view.on 'publishMenuItemClicked', @lazyBound 'publishCurrentApp', 'production'
    view.on 'publishTestMenuItemClicked', @bound 'publishCurrentApp'
    view.on 'compileMenuItemClicked', @bound 'compileApp'
    
    view.on 'previewApp', @bound 'previewApp'
    view.on 'previewCss', @bound 'previewCss'
    
    view.splitPanelFix()
    
    view.ready ->
      {finder} = view.workspace.activePanel.panesByName
      finder.on 'switchMode', view.bound 'switchMode'

  previewApp:(force = no)->

    view = @getView()
    
    return  if not force and not view.liveMode
    return  if @_inprogress
    @_inprogress = yes

    {JSEditor, PreviewPane} = view.workspace.activePanel.panesByName
    editorData = JSEditor.getData()
    extension = if editorData then editorData.getExtension() else 'coffee'

    if extension not in ['js', 'coffee']
      @_inprogress = no
      PreviewPane.destroySubViews()
      PreviewPane.addSubView new EniacErrorPaneWidget {},
        error     :
          name    : "Preview not supported"
          message : "You can only preview .coffee and .js files."
      return

    @compiler (coffee)=>

      code = JSEditor.getValue()

      PreviewPane.destroySubViews()
      window.appView = new KDView
      
      try

        switch extension
          when 'js' then eval code
          when 'coffee' then coffee.run code

        PreviewPane.addSubView window.appView

      catch error

        try window.appView.destroy?()
        warn "Failed to run:", error

        PreviewPane.addSubView new EniacErrorPaneWidget {}, {code, error}

      finally

        delete window.appView
        @_inprogress = no

  previewCss:(force = no)->
  
    view = @getView()
    
    return  if not force and not view.liveMode

    {CSSEditor, PreviewPane} = view.workspace.activePanel.panesByName

    @_css?.remove()

    @_css = $ "<style scoped></style>"
    @_css.html CSSEditor.getValue()

    PreviewPane.domElement.prepend @_css

  compiler:(callback)->

    return callback @coffee  if @coffee
    require [COFFEE], (@coffee)=> callback @coffee

  compileApp:->

    {JSEditor, finder} = @getView().workspace.activePanel.panesByName

    KodingAppsController.compileAppOnServer \
      JSEditor.getData()?.path, (err, app)->

        return warn err  if err
        return warn "NO APP?"  unless app

        {vm, path} = app
        finder.finderController.expandFolders "[#{vm}]#{path}", ->
          fileTree = finder.finderController.treeController
          fileTree.selectNode fileTree.nodes["[#{vm}]#{path}/index.js"]

  createNewApp:->

    view = @getView()
    
    KD.singletons.kodingAppsController.makeNewApp (err, data)=>

      return warn err  if err

      {appPath} = data
      {finder} = view.workspace.activePanel.panesByName

      vmName = KD.singletons.vmController.defaultVmName
      finder.finderController.expandFolders "[#{vmName}]#{appPath}/resources", ->
        fileTree = finder.finderController.treeController
        fileTree.selectNode fileTree.nodes["[#{vmName}]#{appPath}"]

      finder.loadFile "[#{vmName}]#{appPath}/index.coffee"
      finder.loadFile "[#{vmName}]#{appPath}/resources/style.css"

      view.switchMode 'develop'

  publishCurrentApp:(target='test')->

    {JSEditor} = @getView().workspace.activePanel.panesByName
    path = JSEditor.getData()?.path

    unless path
      return new KDNotificationView
        title : "Open an application first"

    KodingAppsController.createJApp {
      path, target
    }, @publishCallback

  publishCallback:(err, app)->
    if err or not app
      warn err
      return new KDNotificationView
        title : "Failed to publish"

    new KDNotificationView
      title: "Published successfully!"

    KD.singletons
      .router.handleRoute "/Apps/#{app.manifest.authorNick}/#{app.name}"

  handleQuery:->
    @getView().splitPanelFix()
