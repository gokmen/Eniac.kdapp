/* Compiled by kdc on Tue Apr 01 2014 05:55:55 GMT+0000 (UTC) */
(function() {
/* KDAPP STARTS */
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/customviews/welcomepage.coffee */
var EniacWelcomePage,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacWelcomePage = (function(_super) {
  __extends(EniacWelcomePage, _super);

  function EniacWelcomePage(options, data) {
    if (options == null) {
      options = {};
    }
    options.cssClass = KD.utils.curry('welcome-pane', options.cssClass);
    EniacWelcomePage.__super__.constructor.call(this, options, data);
    this.buttons = new KDView({
      cssClass: 'button-container'
    });
    this.addButton({
      title: "Create New"
    }, function() {
      return KD.singletons.appManager.tell("Eniac", "createNewApp");
    });
  }

  EniacWelcomePage.prototype.addButton = function(_arg, callback) {
    var cssClass, title, type;
    title = _arg.title, type = _arg.type;
    if (type == null) {
      type = "";
    }
    cssClass = "solid big " + type;
    return this.buttons.addSubView(new KDButtonView({
      title: title,
      cssClass: cssClass,
      callback: callback
    }));
  };

  EniacWelcomePage.prototype.pistachio = function() {
    return "<h1>Welcome to Koding DevTools</h1>\n{{> this.buttons}}";
  };

  EniacWelcomePage.prototype.click = function() {
    return this.setClass('in');
  };

  return EniacWelcomePage;

})(JView);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/customviews/errorpane.coffee */
var EniacErrorPaneWidget,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacErrorPaneWidget = (function(_super) {
  __extends(EniacErrorPaneWidget, _super);

  function EniacErrorPaneWidget(options, data) {
    if (options == null) {
      options = {};
    }
    options.cssClass = KD.utils.curry('error-pane', options.cssClass);
    EniacErrorPaneWidget.__super__.constructor.call(this, options, data);
  }

  EniacErrorPaneWidget.prototype.pistachio = function() {
    var error, line, stack;
    error = this.getData().error;
    line = error.location ? "at line: " + (error.location.last_line + 1) : "";
    stack = error.stack != null ? "<div class='stack'>\n  <h2>Full Stack</h2>\n  <pre>" + error.stack + "</pre>\n</div>" : "";
    return "{h1{#(error.name)}}\n<pre>" + error.message + " " + line + "</pre>\n" + stack;
  };

  EniacErrorPaneWidget.prototype.click = function() {
    return this.setClass('in');
  };

  return EniacErrorPaneWidget;

})(JView);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/customviews/editor.coffee */
var EniacEditor,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacEditor = (function(_super) {
  __extends(EniacEditor, _super);

  function EniacEditor(options, data) {
    if (options == null) {
      options = {};
    }
    options.cssClass = "editor-pane";
    EniacEditor.__super__.constructor.call(this, options, data);
    this.storage = KD.singletons.localStorageController.storage("Eniac");
    this.createEditorInstance();
  }

  EniacEditor.prototype.createEditorInstance = function() {
    var content, file, path,
      _this = this;
    path = "localfile:/empty.coffee";
    file = FSHelper.createFileFromPath(path);
    content = this.getOptions().content;
    this.ace = new Ace({
      delegate: this,
      enableShortcuts: false
    }, file);
    return this.ace.once("ace.ready", function() {
      if (content) {
        _this.ace.editor.setValue(content);
      }
      return _this.prepareEditor();
    });
  };

  EniacEditor.prototype.closeFile = function() {
    return this.openFile(FSHelper.createFileFromPath('localfile:/empty.coffee'));
  };

  EniacEditor.prototype.loadFile = function(path, callback) {
    var file, kite,
      _this = this;
    if (callback == null) {
      callback = noop;
    }
    file = FSHelper.createFileFromPath(path);
    kite = KD.getSingleton('vmController').getKiteByVmName(file.vmName);
    if (!kite) {
      return callback({
        message: "VM not found"
      });
    }
    return file.fetchContents(function(err, content) {
      if (err) {
        return callback(err);
      }
      file.path = path;
      _this.openFile(file, content);
      return KD.utils.defer(function() {
        return callback(null, {
          file: file,
          content: content
        });
      });
    });
  };

  EniacEditor.prototype.loadLastOpenFile = function() {
    var path,
      _this = this;
    path = this.storage.getAt(this._lastFileKey);
    if (!path) {
      return;
    }
    return this.loadFile(path, function(err) {
      if (err != null) {
        return _this.storage.unsetKey(_this._lastFileKey);
      } else {
        return _this.emit("RecentFileLoaded");
      }
    });
  };

  EniacEditor.prototype.openFile = function(file, content) {
    var validPath;
    validPath = file instanceof FSFile && !/^localfile\:/.test(file.path);
    if (validPath) {
      this.storage.setValue(this._lastFileKey, file.path);
    } else {
      this.storage.unsetKey(this._lastFileKey);
    }
    this.ace.editor.setValue(content, -1);
    this.ace.setSyntax();
    return this.setData(file);
  };

  EniacEditor.prototype.viewAppended = function() {
    this.findAndReplaceView = new AceFindAndReplaceView({
      delegate: this
    });
    this.findAndReplaceView.hide();
    this.addSubView(this.ace);
    return this.addSubView(this.findAndReplaceView);
  };

  EniacEditor.prototype.getValue = function() {
    return this.ace.editor.getSession().getValue();
  };

  EniacEditor.prototype.requestSave = function() {
    var content, file;
    file = this.getData();
    if (!file) {
      return;
    }
    content = this.getValue();
    return file.save(content, function(err) {
      if (err) {
        return warn(err);
      }
    });
  };

  EniacEditor.prototype.requestSaveAll = function() {
    return log("save all");
  };

  EniacEditor.prototype.prepareEditor = function() {
    var _this = this;
    this.ace.addKeyCombo("save", "Ctrl-S", this.bound("requestSave"));
    this.ace.addKeyCombo("saveAll", "Ctrl-Shift-S", this.bound("requestSaveAll"));
    this.ace.addKeyCombo("find", "Ctrl-F", this.ace.lazyBound("showFindReplaceView", false));
    this.ace.addKeyCombo("replace", "Ctrl-Shift-F", this.ace.lazyBound("showFindReplaceView", true));
    this.ace.addKeyCombo("preview", "Ctrl-Shift-P", function() {
      return _this.getDelegate().preview();
    });
    this.ace.addKeyCombo("fullscreen", "Ctrl-Enter", function() {
      return _this.getDelegate().toggleFullscreen();
    });
    this.ace.addKeyCombo("gotoLine", "Ctrl-G", this.ace.bound("showGotoLine"));
    this.ace.addKeyCombo("settings", "Ctrl-,", noop);
    return this.on("PaneResized", _.debounce(function() {
      return _this.ace.editor.resize();
    }), 400);
  };

  return EniacEditor;

})(KDView);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/customviews/finder.coffee */
var EniacFinder,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacFinder = (function(_super) {
  __extends(EniacFinder, _super);

  function EniacFinder(options, data) {
    var vmController,
      _this = this;
    if (options == null) {
      options = {};
    }
    EniacFinder.__super__.constructor.call(this, options, data);
    vmController = KD.getSingleton("vmController");
    vmController.fetchDefaultVm(function(err, vm) {
      if (err) {
        warn(err);
      }
      _this.finderController = new NFinderController({
        hideDotFiles: true
      });
      _this.finderController.isNodesHiddenFor = function() {
        return true;
      };
      _this.addSubView(_this.finderController.getView());
      _this.finderController.mountVm(vm);
      return _this.finderController.on("FileNeedsToBeOpened", _this.bound('openFile'));
    });
  }

  EniacFinder.prototype.openFile = function(file) {
    var _this = this;
    return file.fetchContents(function(err, contents) {
      var CSSEditor, JSEditor, editor, panel, _ref;
      if (!err) {
        panel = _this.getDelegate();
        _ref = panel.panesByName, CSSEditor = _ref.CSSEditor, JSEditor = _ref.JSEditor;
        switch (file.getExtension()) {
          case 'css':
          case 'styl':
            editor = CSSEditor;
            break;
          default:
            editor = JSEditor;
        }
        editor.openFile(file, contents);
        return _this.emit("switchMode", 'develop');
      } else {
        return new KDNotificationView({
          type: "mini",
          cssClass: "error",
          title: "Sorry, couldn't fetch file content, please try again...",
          duration: 3000
        });
      }
    });
  };

  EniacFinder.prototype.loadFile = function(path) {
    var file, kite;
    file = FSHelper.createFileFromPath(path);
    kite = KD.getSingleton('vmController').getKiteByVmName(file.vmName);
    if (!kite) {
      return callback({
        message: "VM not found"
      });
    }
    return this.openFile(file);
  };

  return EniacFinder;

})(KDView);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/view.coffee */
var EniacMainView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacMainView = (function(_super) {
  __extends(EniacMainView, _super);

  function EniacMainView(options, data) {
    if (options == null) {
      options = {};
    }
    options.cssClass = 'eniac main-view';
    EniacMainView.__super__.constructor.call(this, options, data);
    log(">>>", this);
    this.storage = KD.singletons.localStorageController.storage("Eniac");
    this.liveMode = this.storage.getValue('liveMode');
    if (this.liveMode == null) {
      this.liveMode = true;
      this.storage.setValue('liveMode', this.liveMode);
    }
    this._currentMode = 'home';
  }

  EniacMainView.prototype.viewAppended = function() {
    var appManager,
      _this = this;
    this.loading = new KDCustomHTMLView({
      tagName: "img",
      cssClass: "pulsing loading",
      attributes: {
        src: "https://koding.com/a/sprites/app@2x/nav-develop.png"
      }
    });
    appManager = KD.getSingleton("appManager");
    appManager.require("Teamwork", function() {
      _this.workspace = new Workspace({
        title: "Eniac",
        cssClass: "eniac",
        name: "Eniac",
        panels: [
          {
            title: "Eniac",
            layout: {
              direction: "vertical",
              sizes: ["256px", null],
              splitName: "BaseSplit",
              views: [
                {
                  type: "custom",
                  name: "finder",
                  paneClass: EniacFinder
                }, {
                  type: "split",
                  options: {
                    direction: "vertical",
                    sizes: ["50%", "50%"],
                    splitName: "InnerSplit",
                    cssClass: "inner-split"
                  },
                  views: [
                    {
                      type: "split",
                      options: {
                        direction: "horizontal",
                        sizes: ["50%", "50%"],
                        splitName: "EditorSplit",
                        cssClass: "editor-split"
                      },
                      views: [
                        {
                          type: "custom",
                          name: "JSEditor",
                          paneClass: EniacEditor
                        }, {
                          type: "custom",
                          name: "CSSEditor",
                          paneClass: EniacEditor
                        }
                      ]
                    }, {
                      type: "custom",
                      name: "PreviewPane",
                      title: "Preview",
                      paneClass: KDView,
                      cssClass: "preview-pane"
                    }
                  ]
                }
              ]
            }
          }
        ]
      });
      _this.workspace.once("viewAppended", function() {
        var CSSEditor, JSEditor, PreviewPane, _ref;
        _this.loading.destroy();
        _this.emit('ready');
        _this.workspace.activePanel.layoutContainer.getSplitByName("InnerSplit").addSubView(_this.welcomePage = new EniacWelcomePage);
        _ref = _this.workspace.activePanel.panesByName, CSSEditor = _ref.CSSEditor, JSEditor = _ref.JSEditor, PreviewPane = _ref.PreviewPane;
        JSEditor.ace.once('ace.ready', function() {
          return JSEditor.ace.editor.on("change", _.debounce(_this.lazyBound('emit', 'previewApp', false), 500));
        });
        return CSSEditor.ace.once('ace.ready', function() {
          return CSSEditor.ace.editor.on("change", _.debounce(_this.lazyBound('emit', 'previewCss', false), 500));
        });
      });
      return KD.utils.defer(function() {
        return _this.addSubView(_this.workspace);
      });
    });
    return this.addSubView(this.loading);
  };

  EniacMainView.prototype.getToggleLiveReloadMenuView = function(item, menu) {
    var itemLabel, toggleLiveReload,
      _this = this;
    itemLabel = "" + (this.liveMode ? 'Disable' : 'Enable') + " live compile";
    toggleLiveReload = new KDView({
      partial: "<span>" + itemLabel + "</span>",
      click: function() {
        _this.toggleLiveReload();
        return menu.contextMenu.destroy();
      }
    });
    toggleLiveReload.on("viewAppended", function() {
      return toggleLiveReload.parent.setClass("default");
    });
    return toggleLiveReload;
  };

  EniacMainView.prototype.getToggleFullscreenMenuView = function(item, menu) {
    var labels, mainView, state, toggleFullscreen,
      _this = this;
    labels = ["Enter Fullscreen", "Exit Fullscreen"];
    mainView = KD.getSingleton("mainView");
    state = mainView.isFullscreen() || 0;
    toggleFullscreen = new KDView({
      partial: "<span>" + labels[Number(state)] + "</span>",
      click: function() {
        mainView.toggleFullscreen();
        return menu.contextMenu.destroy();
      }
    });
    toggleFullscreen.on("viewAppended", function() {
      return toggleFullscreen.parent.setClass("default");
    });
    return toggleFullscreen;
  };

  EniacMainView.prototype.switchMode = function(mode) {
    if (mode == null) {
      mode = 'develop';
    }
    this._currentMode = mode;
    switch (mode) {
      case 'home':
        this.welcomePage.show();
        KD.singletons.mainView.appSettingsMenuButton.hide();
        return KD.utils.defer(this.welcomePage.lazyBound('unsetClass', 'out'));
      default:
        this.welcomePage.setClass('out');
        KD.singletons.mainView.appSettingsMenuButton.show();
        return KD.utils.wait(500, this.welcomePage.bound('hide'));
    }
  };

  EniacMainView.prototype.toggleLiveReload = function(state) {
    var _this = this;
    if (state != null) {
      this.liveMode = state;
    } else {
      this.liveMode = !this.liveMode;
    }
    new KDNotificationView({
      title: this.liveMode ? 'Live compile enabled' : 'Live compile disabled'
    });
    this.storage.setValue('liveMode', this.liveMode);
    if (!this.liveMode) {
      return;
    }
    return KD.utils.defer(function() {
      _this.emit('previewApp', true);
      return _this.emit('previewCss', true);
    });
  };

  EniacMainView.prototype.splitPanelFix = function() {
    return this.ready(function() {
      var wc;
      wc = KD.getSingleton("windowController");
      wc.notifyWindowResizeListeners();
      wc.notifyWindowResizeListeners();
      if (this._currentMode !== 'home') {
        return KD.singletons.mainView.appSettingsMenuButton.show();
      }
    });
  };

  return EniacMainView;

})(KDView);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/app/controller.coffee */
var EniacController,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EniacController = (function(_super) {
  var COFFEE;

  __extends(EniacController, _super);

  COFFEE = "//cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js";

  function EniacController(options, data) {
    if (options == null) {
      options = {};
    }
    options.view = new EniacMainView;
    options.appInfo = {
      name: "Eniac",
      type: "application"
    };
    EniacController.__super__.constructor.call(this, options, data);
    this.getView().once('viewAppended', this.bound('bindEvents'));
  }

  EniacController.prototype.bindEvents = function(view) {
    if (view == null) {
      view = this.getView();
    }
    view.on('createMenuItemClicked', this.bound('createNewApp'));
    view.on('publishMenuItemClicked', this.lazyBound('publishCurrentApp', 'production'));
    view.on('publishTestMenuItemClicked', this.bound('publishCurrentApp'));
    view.on('compileMenuItemClicked', this.bound('compileApp'));
    view.on('previewApp', this.bound('previewApp'));
    view.on('previewCss', this.bound('previewCss'));
    view.splitPanelFix();
    return view.ready(function() {
      var finder;
      finder = view.workspace.activePanel.panesByName.finder;
      return finder.on('switchMode', view.bound('switchMode'));
    });
  };

  EniacController.prototype.previewApp = function(force) {
    var JSEditor, PreviewPane, editorData, extension, view, _ref,
      _this = this;
    if (force == null) {
      force = false;
    }
    view = this.getView();
    if (!force && !view.liveMode) {
      return;
    }
    if (this._inprogress) {
      return;
    }
    this._inprogress = true;
    _ref = view.workspace.activePanel.panesByName, JSEditor = _ref.JSEditor, PreviewPane = _ref.PreviewPane;
    editorData = JSEditor.getData();
    extension = editorData ? editorData.getExtension() : 'coffee';
    if (extension !== 'js' && extension !== 'coffee') {
      this._inprogress = false;
      PreviewPane.destroySubViews();
      PreviewPane.addSubView(new EniacErrorPaneWidget({}, {
        error: {
          name: "Preview not supported",
          message: "You can only preview .coffee and .js files."
        }
      }));
      return;
    }
    return this.compiler(function(coffee) {
      var code, error, _base;
      code = JSEditor.getValue();
      PreviewPane.destroySubViews();
      window.appView = new KDView;
      try {
        switch (extension) {
          case 'js':
            eval(code);
            break;
          case 'coffee':
            coffee.run(code);
        }
        return PreviewPane.addSubView(window.appView);
      } catch (_error) {
        error = _error;
        try {
          if (typeof (_base = window.appView).destroy === "function") {
            _base.destroy();
          }
        } catch (_error) {}
        warn("Failed to run:", error);
        return PreviewPane.addSubView(new EniacErrorPaneWidget({}, {
          code: code,
          error: error
        }));
      } finally {
        delete window.appView;
        _this._inprogress = false;
      }
    });
  };

  EniacController.prototype.previewCss = function(force) {
    var CSSEditor, PreviewPane, view, _ref, _ref1;
    if (force == null) {
      force = false;
    }
    view = this.getView();
    if (!force && !view.liveMode) {
      return;
    }
    _ref = view.workspace.activePanel.panesByName, CSSEditor = _ref.CSSEditor, PreviewPane = _ref.PreviewPane;
    if ((_ref1 = this._css) != null) {
      _ref1.remove();
    }
    this._css = $("<style scoped></style>");
    this._css.html(CSSEditor.getValue());
    return PreviewPane.domElement.prepend(this._css);
  };

  EniacController.prototype.compiler = function(callback) {
    var _this = this;
    if (this.coffee) {
      return callback(this.coffee);
    }
    return require([COFFEE], function(coffee) {
      _this.coffee = coffee;
      return callback(_this.coffee);
    });
  };

  EniacController.prototype.compileApp = function() {
    var JSEditor, finder, _ref, _ref1;
    _ref = this.getView().workspace.activePanel.panesByName, JSEditor = _ref.JSEditor, finder = _ref.finder;
    return KodingAppsController.compileAppOnServer((_ref1 = JSEditor.getData()) != null ? _ref1.path : void 0, function(err, app) {
      var path, vm;
      if (err) {
        return warn(err);
      }
      if (!app) {
        return warn("NO APP?");
      }
      vm = app.vm, path = app.path;
      return finder.finderController.expandFolders("[" + vm + "]" + path, function() {
        var fileTree;
        fileTree = finder.finderController.treeController;
        return fileTree.selectNode(fileTree.nodes["[" + vm + "]" + path + "/index.js"]);
      });
    });
  };

  EniacController.prototype.createNewApp = function() {
    var view,
      _this = this;
    view = this.getView();
    return KD.singletons.kodingAppsController.makeNewApp(function(err, data) {
      var appPath, finder, vmName;
      if (err) {
        return warn(err);
      }
      appPath = data.appPath;
      finder = view.workspace.activePanel.panesByName.finder;
      vmName = KD.singletons.vmController.defaultVmName;
      finder.finderController.expandFolders("[" + vmName + "]" + appPath + "/resources", function() {
        var fileTree;
        fileTree = finder.finderController.treeController;
        return fileTree.selectNode(fileTree.nodes["[" + vmName + "]" + appPath]);
      });
      finder.loadFile("[" + vmName + "]" + appPath + "/index.coffee");
      finder.loadFile("[" + vmName + "]" + appPath + "/resources/style.css");
      return view.switchMode('develop');
    });
  };

  EniacController.prototype.publishCurrentApp = function(target) {
    var JSEditor, app, modal, options, path, _ref,
      _this = this;
    if (target == null) {
      target = 'test';
    }
    JSEditor = this.getView().workspace.activePanel.panesByName.JSEditor;
    path = (_ref = JSEditor.getData()) != null ? _ref.path : void 0;
    if (!path) {
      return new KDNotificationView({
        title: "Open an application first"
      });
    }
    app = KodingAppsController.getAppInfoFromPath(path);
    options = {
      path: path
    };
    if (target === 'production') {
      modal = new KodingAppSelectorForGitHub({
        title: "Select repository of " + app.name + ".kdapp",
        customFilter: RegExp("" + app.name + "\\.kdapp$")
      });
      return modal.on("RepoSelected", function(repo) {
        return GitHub.getLatestCommit(repo.name, function(err, commit) {
          if (err) {
            return new KDNotificationView({
              title: "Failed to fetch latest commit for " + repo.full_name
            });
          }
          options.githubPath = "" + KD.config.appsUri + "/" + repo.full_name + "/" + commit.sha + "/";
          return KodingAppsController.createJApp(options, _this.publishCallback);
        });
      });
    } else {
      return KodingAppsController.createJApp(options, this.publishCallback);
    }
  };

  EniacController.prototype.publishCallback = function(err, app) {
    if (err || !app) {
      warn(err);
      return new KDNotificationView({
        title: "Failed to publish"
      });
    }
    new KDNotificationView({
      title: "Published successfully!"
    });
    return KD.singletons.router.handleRoute("/Apps/" + app.manifest.authorNick + "/" + app.name);
  };

  EniacController.prototype.handleQuery = function() {
    return this.getView().splitPanelFix();
  };

  return EniacController;

})(AppController);
/* BLOCK STARTS: /home/gokmen/Applications/Eniac.kdapp/index.coffee */
(function() {
  var version, view;
  if (typeof appView !== "undefined" && appView !== null) {
    view = new EniacMainView;
    return appView.addSubView(view);
  } else {
    version = "0.1";
    window.eniac = {
      version: version
    };
    return KD.registerAppClass(EniacController, {
      name: "Eniac",
      version: version,
      routes: {
        "/:name?/Eniac": null,
        "/:name?/gokmen/Apps/Eniac": null
      },
      dockPath: "/gokmen/Apps/Eniac",
      behavior: "application",
      menu: {
        items: [
          {
            title: "Create a new App",
            eventName: "create"
          }, {
            type: "separator"
          }, {
            title: "Save",
            eventName: "save"
          }, {
            title: "Save All",
            eventName: "saveAll"
          }, {
            title: "Close All",
            eventName: "closeAll"
          }, {
            type: "separator"
          }, {
            title: "Compile on server",
            eventName: "compile"
          }, {
            title: "Publish for Testing",
            eventName: "publishTest"
          }, {
            title: "Publish to AppStore",
            eventName: "publish"
          }, {
            title: "customViewToggleLiveReload"
          }, {
            type: "separator"
          }, {
            title: "customViewToggleFullscreen"
          }, {
            type: "separator"
          }, {
            title: "Exit",
            eventName: "exit"
          }
        ]
      }
    });
  }
})();

/* KDAPP ENDS */
}).call();