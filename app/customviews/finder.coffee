class EniacFinder extends KDView

  constructor: (options = {}, data) ->

    super options, data

    vmController = KD.getSingleton "vmController"
    vmController.fetchDefaultVm (err, vm) =>
      
      warn err  if err
      
      @finderController = new NFinderController {
        hideDotFiles : yes
      }
      
      # Temporary fix, until its fixed in upstream ~ GG
      @finderController.isNodesHiddenFor = -> yes
      
      @addSubView @finderController.getView()
      @finderController.mountVm vm
      
      @finderController.on "FileNeedsToBeOpened", @bound 'openFile'

  openFile: (file) ->
  
    file.fetchContents (err, contents) =>
    
      unless err
        
        panel = @getDelegate()
        {CSSEditor, JSEditor} = panel.panesByName

        switch file.getExtension()
          when 'css', 'styl'
          then editor = CSSEditor
          else editor = JSEditor
        
        editor.ace.setData file
        editor.ace.setContents contents
        editor.ace.setSyntax()
        
        @emit "switchMode", 'develop'
        
      else
        
        new KDNotificationView
          type     : "mini"
          cssClass : "error"
          title    : "Sorry, couldn't fetch file content, please try again..."
          duration : 3000

  loadFile: (path)->

    file = FSHelper.createFileFromPath path

    kite = KD.getSingleton('vmController').getKiteByVmName file.vmName
    return  callback {message: "VM not found"}  unless kite

    @openFile file