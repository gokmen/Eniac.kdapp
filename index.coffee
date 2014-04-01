do ->

  # In live mode you can add your App view to window's appView
  if appView?

    view = new EniacMainView
    appView.addSubView view

  else

    version = "0.1"
    window.eniac = {version}
    
    KD.registerAppClass EniacController,
      name            : "Eniac"
      version         : version
      routes          :
        "/:name?/Eniac" : null
        "/:name?/gokmen/Apps/Eniac" : null
      dockPath        : "/gokmen/Apps/Eniac"
      behavior        : "application"
      menu            :
        items         : [
          { title     : "Create a new App",    eventName : "create" }
          { type      : "separator" }
          { title     : "Save",                eventName : "save" }
          { title     : "Save All",            eventName : "saveAll" }
          { title     : "Close All",           eventName : "closeAll" }
          { type      : "separator" }
          { title     : "Compile on server",   eventName : "compile" }
          { title     : "Publish for Testing", eventName : "publishTest" }
          { title     : "Publish to AppStore", eventName : "publish" }
          { title     : "customViewToggleLiveReload" }
          { type      : "separator" }
          { title     : "customViewToggleFullscreen" }
          { type      : "separator" }
          { title     : "Exit",                eventName : "exit" }
        ]
        # hiddenOnStart : yes
