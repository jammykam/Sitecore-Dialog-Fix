﻿if (typeof (Sitecore) == "undefined") Sitecore = new Object();
if (typeof (Sitecore.Controls) == "undefined") Sitecore.Controls = new Object();

Sitecore.Controls.RichEditor = Class.create({
  initialize: function(editorId) {
    this.editorId = editorId;

    Event.observe(window, "resize", this.fitEditorToScreen.bind(this));
  },

  onClientLoad: function(editor) {
    editor.attachEventHandler("onkeydown", this.onKeyDown.bind(this));

    this.oldValue = editor.get_html(true);

    this.fitEditorToScreen();
  },

  getEditor: function() {
    if (typeof ($find) == "function") {
      return $find(this.editorId);
    }

    return null;
  },

  fitEditorToScreen: function() {
    var editor = this.getEditor();
    if (!editor) {
      return;
    }

    var container = $$("form")[0];

    var width = 0;
    var height = 0;

    if (container.getHeight != null) {
      height = container.getHeight() - 28;
      width = container.getWidth();
    }
    else {
      width = container.offsetWidth;
      height = (container.offsetHeight - 28);
    }

    if (height < 0) {
      return;
    }

    editor.setSize(width, height);
  },

  saveRichText: function(html) {
    var w = scForm.browser.getParentWindow(window.frameElement.ownerDocument);
    if (w.frameElement) {
      w = scForm.browser.getParentWindow(w.frameElement.ownerDocument);
    }

    w.scContent.saveRichText(html);
  },

  setFocus: function() {
    var editor = this.getEditor();
    if (!editor) {
      return;
    }

    editor.setFocus();
  },

  setText: function(html) {
    var editor = this.getEditor();
    if (!editor) {
      return;
    }

    editor.set_html(html);
  },

  onKeyDown: function(evt) {
    var editor = this.getEditor();

    if (editor == null || evt == null) {
      return;
    }

    if (evt.ctrlKey && evt.keyCode == 13) {
      scSendRequest("editorpage:accept");
      return;
    }

    if (!scForm.isFunctionKey(evt, true)) {
      scForm.setModified(true);
    }
  }
});

function scCloseEditor() {
   var doc = window.top.document;
   // Content editor
   var w = doc.getElementById('overlayWindow');
   if (!w) {
    // Field editor
    w = doc.getElementById('feRTEContainer');
   }

   if (w) {        
    $(w).hide();
   }
   else {
    // Page editor
     if (scForm.browser.isIE) {
    window.close();
   }
     else if (top._scDialogs.length != 0) {
       top.dialogClose();
     } else {
       scCloseRadWindow();
     }
   }
}

function scGetRadWindow() {
  var currentRadWindow = null;
  if (window.radWindow)
    currentRadWindow = window.radWindow;
  else if (window.frameElement.radWindow)
    currentRadWindow = window.frameElement.radWindow;
  return currentRadWindow;
}

function scCloseRadWindow() {
  var currentRadWindow = scGetRadWindow();
  if (currentRadWindow != null) {
    // Hack for IE. Window is not closed because code thinks that window is already closed. Calling 'show' before closing helps to solve the problem. 
    currentRadWindow.show();
    currentRadWindow.close();
  }
  return false;
}