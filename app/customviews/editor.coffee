class EniacEditor extends KDView

  constructor:(options = {}, data)->

    options.cssClass = "editor-pane"
    super options, data

    @storage = KD.singletons.localStorageController.storage "Eniac"
    @createEditorInstance()

  createEditorInstance:->

    path      = "localfile:/empty.coffee"
    file      = FSHelper.createFileFromPath path
    {content} = @getOptions()

    @ace      = new Ace
      delegate        : this
      enableShortcuts : no
    , file

    @ace.once "ace.ready", =>
      if content then @ace.editor.setValue content
      @prepareEditor()

  closeFile:->
    @openFile FSHelper.createFileFromPath 'localfile:/empty.coffee'

  loadFile:(path, callback = noop)->

    file = FSHelper.createFileFromPath path
    
    kite = KD.getSingleton('vmController').getKiteByVmName file.vmName
    return  callback {message: "VM not found"}  unless kite

    file.fetchContents (err, content)=>
      return callback err  if err

      file.path = path
      @openFile file, content

      KD.utils.defer -> callback null, {file, content}

  loadLastOpenFile:->

    path = @storage.getAt @_lastFileKey
    return  unless path

    @loadFile path, (err)=>
      if err?
      then @storage.unsetKey @_lastFileKey
      else @emit "RecentFileLoaded"

  openFile: (file, content)->

    validPath = file instanceof FSFile and not /^localfile\:/.test file.path

    if validPath
    then @storage.setValue @_lastFileKey, file.path
    else @storage.unsetKey @_lastFileKey
  
    @ace.editor.setValue content, -1
    @ace.setSyntax()
    
    @setData file

  viewAppended:->
    
    @findAndReplaceView = new AceFindAndReplaceView delegate: @
    @findAndReplaceView.hide()
    
    @addSubView @ace
    @addSubView @findAndReplaceView

  getValue: ->
    @ace.editor.getSession().getValue()
  
  requestSave:->
    
    file    = @getData()
    return  unless file
    content = @getValue()
    
    file.save content, (err)-> warn err  if err
    
  requestSaveAll:->
    log "save all"

  prepareEditor:->
    
    @ace.addKeyCombo "save",       "Ctrl-S",       @bound "requestSave"
    @ace.addKeyCombo "saveAll",    "Ctrl-Shift-S", @bound "requestSaveAll"
    @ace.addKeyCombo "find",       "Ctrl-F",       @ace.lazyBound "showFindReplaceView", no
    @ace.addKeyCombo "replace",    "Ctrl-Shift-F", @ace.lazyBound "showFindReplaceView", yes
    @ace.addKeyCombo "preview",    "Ctrl-Shift-P", => @getDelegate().preview()
    @ace.addKeyCombo "fullscreen", "Ctrl-Enter",   => @getDelegate().toggleFullscreen()
    @ace.addKeyCombo "gotoLine",   "Ctrl-G",       @ace.bound "showGotoLine"
    @ace.addKeyCombo "settings",   "Ctrl-,",       noop # ace creates a settings view for this shortcut, overriding it.
  
    @on "PaneResized", _.debounce(=> @ace.editor.resize()) , 400
