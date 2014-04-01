class EniacMainView extends KDView

  constructor:(options = {}, data)->
    options.cssClass = 'eniac main-view'
    super options, data
    
    log ">>>", this
    @storage   = KD.singletons.localStorageController.storage "Eniac"
    @liveMode  = @storage.getValue 'liveMode'

    unless @liveMode?
     @liveMode = yes
     @storage.setValue 'liveMode', @liveMode

    @_currentMode = 'home'

  viewAppended:->
    
    @loading     = new KDCustomHTMLView
      tagName    : "img"
      cssClass   : "pulsing loading"
      attributes :
        src      : "https://koding.com/a/sprites/app@2x/nav-develop.png"

    appManager = KD.getSingleton "appManager"
    appManager.require "Teamwork", =>

      @workspace  = new Workspace
      
        title                     : "Eniac"
        cssClass                  : "eniac"
        name                      : "Eniac"
        panels                    : [
          title                   : "Eniac"
          layout                  :
            direction             : "vertical"
            sizes                 : ["256px", null]
            splitName             : "BaseSplit"
            views                 : [
              {
                type              : "custom"
                name              : "finder"
                paneClass         : EniacFinder
              }
              {
                type              : "split"
                options           :
                  direction       : "vertical"
                  sizes           : [ "50%", "50%" ]
                  splitName       : "InnerSplit"
                  cssClass        : "inner-split"
                views             : [
                  {
                    type          : "split"
                    options       :
                      direction   : "horizontal"
                      sizes       : [ "50%", "50%" ]
                      splitName   : "EditorSplit"
                      cssClass    : "editor-split"
                    views         : [
                      {
                        type      : "custom"
                        name      : "JSEditor"
                        paneClass : EniacEditor
                      }
                      {
                        type      : "custom"
                        name      : "CSSEditor"
                        paneClass : EniacEditor
                      }
                    ]
                  }
                  {
                    type          : "custom"
                    name          : "PreviewPane"
                    title         : "Preview"
                    paneClass     : KDView
                    cssClass      : "preview-pane"
                  }
                ]
              }
            ]
        ]

      @workspace.once "viewAppended", =>
        
        @loading.destroy()
        @emit 'ready'

        @workspace.activePanel
          .layoutContainer.getSplitByName("InnerSplit")
          .addSubView @welcomePage = new EniacWelcomePage

        {CSSEditor, JSEditor, PreviewPane} = \
          @workspace.activePanel.panesByName
    
        JSEditor.ace.once 'ace.ready', =>
          
          JSEditor.ace.editor.on "change", \
            _.debounce (@lazyBound 'emit', 'previewApp', no), 500

        CSSEditor.ace.once 'ace.ready', =>
          
          CSSEditor.ace.editor.on "change", \
            _.debounce (@lazyBound 'emit', 'previewCss', no), 500

      KD.utils.defer => @addSubView @workspace
      
    @addSubView @loading
  
  getToggleLiveReloadMenuView: (item, menu)->

    itemLabel = "#{if @liveMode then 'Disable' else 'Enable'} live compile"
    
    toggleLiveReload = new KDView
      partial : """<span>#{itemLabel}</span>"""
      click   : =>
        @toggleLiveReload()
        menu.contextMenu.destroy()
    
    toggleLiveReload.on "viewAppended", ->
      toggleLiveReload.parent.setClass "default"

    return toggleLiveReload

  getToggleFullscreenMenuView: (item, menu)->
    labels = [
      "Enter Fullscreen"
      "Exit Fullscreen"
    ]
    mainView = KD.getSingleton "mainView"
    state    = mainView.isFullscreen() or 0
    toggleFullscreen = new KDView
      partial : "<span>#{labels[Number state]}</span>"
      click   : =>
        mainView.toggleFullscreen()
        menu.contextMenu.destroy()

    toggleFullscreen.on "viewAppended", ->
      toggleFullscreen.parent.setClass "default"

    return toggleFullscreen
    
  switchMode: (mode = 'develop')->

    @_currentMode = mode

    switch mode
      when 'home'
        @welcomePage.show()
        KD.singletons.mainView.appSettingsMenuButton.hide()
        KD.utils.defer @welcomePage.lazyBound 'unsetClass', 'out'
      else
        @welcomePage.setClass 'out'
        KD.singletons.mainView.appSettingsMenuButton.show()
        KD.utils.wait 500, @welcomePage.bound 'hide'

  toggleLiveReload:(state)->

    if state?
    then @liveMode = state
    else @liveMode = !@liveMode

    new KDNotificationView
      title: if @liveMode then 'Live compile enabled' \
                          else 'Live compile disabled'

    @storage.setValue 'liveMode', @liveMode
    return  unless @liveMode

    KD.utils.defer =>
      @emit 'previewApp', yes
      @emit 'previewCss', yes
      
  splitPanelFix:->
    
    @ready ->
      
      # This is a temporary resize fix for KDSplitView
      # TODO: Remove this when its fixed in KD Framework
      wc = KD.getSingleton("windowController")
      wc.notifyWindowResizeListeners()
      wc.notifyWindowResizeListeners()

      unless @_currentMode is 'home'
        KD.singletons.mainView.appSettingsMenuButton.show()
  