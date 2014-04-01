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
      enableShortcuts : yes
    , file

    if content
      ace.once "ace.ready", ->
        ace.editor.setValue content

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
  
    @setData file
    @ace.setValue content

  viewAppended:->
    
    @findAndReplaceView = new AceFindAndReplaceView delegate: @
    @findAndReplaceView.hide()
    
    @addSubView @ace
    @addSubView @findAndReplaceView

  getValue: ->
    @ace.editor.getSession().getValue()

  #  path = (FSHelper.plainPath file.path).replace \
  #    "/home/#{KD.nick()}/Applications/", ""
  #  @header.title.updatePartial if not validPath then @_defaultTitle else path

  ###
  createEditor: (callback)->

    @loadAddons().then =>

      @codeMirrorEditor = CodeMirror @container.getDomElement()[0],
        lineNumbers     : yes
        lineWrapping    : yes
        styleActiveLine : yes
        scrollPastEnd   : yes
        cursorHeight    : 1
        tabSize         : 2
        mode            : @_mode
        extraKeys       :
          "Cmd-S"       : @bound "handleSave"
          "Ctrl-S"      : @bound "handleSave"
          "Shift-Cmd-S" : => @emit "SaveAllRequested"
          "Shift-Ctrl-S": => @emit "SaveAllRequested"
          "Alt-R"       : => @emit "RunRequested"
          "Shift-Ctrl-R": => @emit "AutoRunRequested"
          "Ctrl-Space"  : (cm)->
            mode = CodeMirror.innerMode(cm.getMode()).mode.name
            if mode is 'coffeescript'
              CodeMirror.showHint cm, CodeMirror.coffeescriptHint
            else if mode is 'css'
              CodeMirror.showHint cm, CodeMirror.hint.css
          "Tab"         : (cm)->
            spaces = Array(cm.getOption("indentUnit") + 1).join " "
            cm.replaceSelection spaces, "end", "+input"

      @setEditorTheme 'xq-dark'
      @setEditorMode @_mode ? "coffee"

      callback?()

      @header.addSubView @info = new KDView
        cssClass : "inline-info"
        partial  : "saved"

      @on 'EditorDidSave', =>
        @info.updatePartial 'saved'; @info.setClass 'in'
        KD.utils.wait 1000, => @info.unsetClass 'in'

      @codeMirrorEditor.on 'focus', => @emit "FocusedOnMe"
  ###
