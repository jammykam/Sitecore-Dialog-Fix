function scBrowser() {
  this.isIE = false;
  var ua = navigator.userAgent.toLowerCase();
  this.isChrome = ua.indexOf('chrome') >= 0;
  this.isWebkit = ua.indexOf('applewebkit/') > -1;
  this.isSafari = this.isWebkit && !this.isChrome;
  this.isFirefox = ua.indexOf('gecko') > -1 && ua.indexOf('khtml') === -1;
  this.onPopupClosed = null;
}


// ----------------------------------------------------------------------------

scBrowser.prototype.initializeModalDialogs = function () {
    if (!top.scIsDialogsInitialized) {
        top.scIsDialogsInitialized = true;

        var jqueryModalDialogsFrame = top.document.createElement("iframe");
        jqueryModalDialogsFrame.setAttribute("frameborder", "0");
        jqueryModalDialogsFrame.setAttribute("allowTransparency", "true");
        jqueryModalDialogsFrame.setAttribute("id", "jqueryModalDialogsFrame");
        jqueryModalDialogsFrame.setAttribute("src", "/sitecore/shell/Controls/JqueryModalDialogs.html");
        jqueryModalDialogsFrame.setAttribute("style", "position: absolute; left: 0; right: 0; top: 0; bottom: 0; width: 100%; height: 100%; z-index: -1; margin: 0; padding: 0; border-width: 0; overflow: hidden");
        top.document.body.appendChild(jqueryModalDialogsFrame);

        if (!top.scForm) {
            top.scForm = { getTopModalDialog: window.scForm.getTopModalDialog };
        }
    }
};

scBrowser.prototype.showjQueryModalDialog = function (url, dialogArguments, features, request, dialogClosedCallback) {

    var jqueryModalDialogsFrame = top.document.getElementById("jqueryModalDialogsFrame");
    if (jqueryModalDialogsFrame && jqueryModalDialogsFrame.contentWindow) {
        jqueryModalDialogsFrame.contentWindow.showModalDialog(url, dialogArguments, features, request, this.modifiedHandling, window, dialogClosedCallback);
    }
};

scBrowser.prototype.setDialogDimension = function (width, height) {
    var jqueryModalDialogsFrame = top.document.getElementById("jqueryModalDialogsFrame");
    if (jqueryModalDialogsFrame && jqueryModalDialogsFrame.contentWindow) {
        jqueryModalDialogsFrame.contentWindow.setDialogDimension(width, height);
    }
};

scBrowser.prototype.hideCloseButton = function () {
    top._scDialogs[0].contentIframe.dialog('widget').addClass('no-close');
};

scBrowser.prototype.showCloseButton = function () {
    top._scDialogs[0].contentIframe.dialog('widget').removeClass('no-close');
};

scBrowser.prototype.getTopModalDialog = function () {
    var jqueryModalDialogsFrame = top.document.getElementById("jqueryModalDialogsFrame");
    if (jqueryModalDialogsFrame && jqueryModalDialogsFrame.contentWindow && top._scDialogs && top._scDialogs.length > 0) {
        var dialog = top._scDialogs[0];
        if (dialog) {
            var contentFrame = dialog.contentIframe[0];
            var framesCollection = jqueryModalDialogsFrame.contentWindow.frames;
            for (var i = 0; i < framesCollection.length; i++) {
                if (framesCollection[i].frameElement == contentFrame) {
                    return framesCollection[i];
                }
            }
        }
    }

    return null;
};

// ----------------------------------------------------------------------------



scBrowser.prototype.initialize = function () {
  /* excess in content editor - see if we need this in other apps */
  this.attachEvent(document.body, "onclick", function () { scGeckoActivate(); scGeckoClosePopups("body onclick"); });
  this.attachEvent(document.body, "ondblclick", function () { scGeckoClosePopups("body ondblclick"); });
  this.attachEvent(document.body, "oncontextmenu", function () { scGeckoClosePopups("body oncontextmenu"); });
  this.adjustFillParentElements();
  this.initializeFixsizeElements();
  this.fixSafariModalDialogs();
  Event.observe(window, "resize", function () { setTimeout(scForm.browser.resizeFixsizeElements.bind(scForm.browser), 1); });

  this.initializeModalDialogs();
}

scBrowser.prototype.attachEvent = function(object, eventName, method) {
  eventName = eventName.replace(/on/, "");
  var isWebkit = this.isWebkit;
  method._eventHandler = function(e) {
    if (!isWebkit) {      
      window.event = e;    
    }
    return method();
  };
  
  object.addEventListener(eventName, method._eventHandler, false);
}

scBrowser.prototype.detachEvent = function(object, eventName, method) {
  eventName = eventName.replace(/on/, "");
  
  if (typeof(method._eventHandler) == "function") {
    object.removeEventListener(eventName, method._eventHandler, false);
  }
  else {
    object.removeEventListener(eventName, method, true);
  }
}

scBrowser.prototype.clearEvent = function(evt, cancelBubble, returnValue, keyCode) {
  if (evt != null) {
    if (cancelBubble == true) {
      if (evt.stopPropagation != null) {
      evt.stopPropagation();
    }
    }
    if (returnValue == false) {
      if (evt.preventDefault != null) {
      evt.preventDefault();
    }
  }
  }
  // ignore keycode
}
    
scBrowser.prototype.closePopups = function(reason, exclusions) {
  if (window.top.popups != null) {
    if (reason == "mainWindowBlur") {
      return;
    }
    
    for(var n = 0; n < window.top.popups.length; n++) {
      if (exclusions && exclusions.indexOf(window.top.popups[n]) >= 0) {
        continue;
      }

      var ctl = $(window.top.popups[n]);      
      if (ctl) {
        ctl.remove();
      }
    }
  }

  window.top.popups = exclusions ? $$(".scPopup") : null;
  if (this.onPopupClosed) {   
    this.onPopupClosed.call(this, reason);
}
}
    
scBrowser.prototype.createHttpRequest = function() {
  return new XMLHttpRequest();
}

scBrowser.prototype.getControl = function(id, doc) {
  return (doc != null ? doc : document).getElementById(id);
}

scBrowser.prototype.getEnumerator = function(collection) {
  return new scGeckoEnumerator(collection);
}

scBrowser.prototype.getFrameElement = function(win) {
  win = win ? win : window;

  var parent = win.parent;
  if (parent == null) {
    return null;
  }

  for (var e = scForm.browser.getEnumerator(parent.document.getElementsByTagName("IFRAME")); !e.atEnd(); e.moveNext()) {

    var ctl = e.item();

    if (ctl.contentWindow == win) {
      return ctl;
    }
  }

  return null;
}

scBrowser.prototype.getImageSrc = function(img) {
  return img.src;
}

scBrowser.prototype.getMouseButton = function(evt) {
  return 1;
}

scBrowser.prototype.getNextSibling = function(ctl) {
  ctl = ctl.nextSibling;
  
  while (ctl != null && ctl.nodeType != 1) {
    ctl = ctl.nextSibling;
  }
  
  return ctl;
}

scBrowser.prototype.getOffset = function(evt) {
  var result = new Object();
  
  result.x = evt.pageX != null ? evt.pageX : 0;
  result.y = evt.pageY != null ? evt.pageY : 0;
  
  return result;
}

scBrowser.prototype.getOuterHtml = function(control) {
  var attr;
  var attrs = control.attributes;
  var str = "<" + control.tagName;
  
  for(var i = 0; i < attrs.length; i++) {
    attr = attrs[i];
    if (this.isFirefox || attr.specified) {
      str += " " + attr.name + '="' + attr.value + '"';
    }
  }
  
  switch (control.tagName) {
    case "AREA":
    case "BASE":
    case "BASEFONT":
    case "COL":
    case "FRAME":
    case "HR":
    case "IMG":
    case "BR":
    case "INPUT":
    case "ISINDEX":
    case "LINK":
    case "META":
    case "PARAM":
      return str + ">";
  }
  
  return str + ">" + control.innerHTML + "</" + control.tagName + ">";
}

scBrowser.prototype.getParentWindow = function(doc) {
  var result = doc.contentWindow;

  if (result == null) {
    result = doc.defaultView;
  }

  return result;
}

scBrowser.prototype.getPreviousSibling = function(ctl) {
  ctl = ctl.previousSibling;
  
  while (ctl != null && ctl.nodeType != 1) {
    ctl = ctl.previousSibling;
  }
  
  return ctl;
}

scBrowser.prototype.getSrcElement = function(evt) {
  return evt.target;
}

scBrowser.prototype.getTableRows = function(table) {
  var result = new Array()
 
  for(var n = 0; n < table.childNodes.length; n++) {
    var ctl = table.childNodes[n];
    
    if (ctl.tagName == "TR") {
      result.push(ctl)
    }
    else if (ctl.tagName == "TBODY") {
      for(var i = 0; i < ctl.childNodes.length; i++) {
        var c = ctl.childNodes[i];
        
        if (c.tagName == "TR") {
          result.push(c);
        }
      }
    }
  } 
  
  return result;
}

scBrowser.prototype.prompt = function(text, defaultValue) {
  if (!this.isSafari) {
    return prompt(text, defaultValue);
  } else {
    var arguments = new Array(text, defaultValue);
    var features = "dialogWidth:400px;dialogHeight:110px;help:no;scroll:no;resizable:no;status:no;center:yes";
    
    return showModalDialog("/sitecore/shell/prompt.html", arguments, features);
  }
};

scBrowser.prototype.insertAdjacentHTML = function (control, where, html) {
  if(!control.insertAdjacentHTML){
    var df;
    var r = control.ownerDocument.createRange();

    switch (String(where).toLowerCase()) {
      case "beforebegin":
        r.setStartBefore(control);
        df = r.createContextualFragment(html);
        control.parentNode.insertBefore(df, control);
        break;

      case "afterbegin":
        r.selectNodeContents(control);
        r.collapse(true);
        df = r.createContextualFragment(html);
        control.insertBefore(df, control.firstChild);
        break;

      case "beforeend":
        r.selectNodeContents(control);
        r.collapse(false);
        df = r.createContextualFragment(html);
        control.appendChild(df);
        break;

      case "afterend":
        r.setStartAfter(control);
        df = r.createContextualFragment(html);
        control.parentNode.insertBefore(df, control.nextSibling);
        break;
    }
  }
  else{
    control.insertAdjacentHTML(where, html);
  }
}

scBrowser.prototype.releaseCapture = function (control) {
  scGeckoCapturedControl = null;
  scGeckoCaptureFunction = null;
  this.releaseCaptureWindow(window);
}

scBrowser.prototype.releaseCaptureWindow = function (win) {
  //we need try\catch because we might not have access to frames running in some other domains or frames with silverlight applications loaded.
  try {
    win.document.onclick = win.scGeckoDocumentClick;
    win.document.onmousedown = win.scGeckoDocumentMouseDown;
    win.document.onmousemove = win.scGeckoDocumentMouseMove;
    win.document.onmouseup = win.scGeckoDocumentMouseUp;
  }
  catch (err) { }

  for (var n = 0; n < win.frames.length; n++) {
    this.releaseCaptureWindow(win.frames[n]);
  }
}

scBrowser.prototype.scrollIntoView = function (control) {
  control.scrollIntoView();
}

scBrowser.prototype.setCapture = function (control, func) {
  scGeckoCapturedControl = control;
  scGeckoCaptureFunction = func;
  this.setCaptureWindow(window, control);
}

scBrowser.prototype.setCaptureWindow = function (win, control) {
  //we need try\catch because we might not have access to frames running in some other domains or loading silverlight applications in a frame.
  try {
    win.scGeckoDocumentClick = win.document.onclick;
    win.scGeckoDocumentMouseDown = win.document.onmousedown;
    win.scGeckoDocumentMouseMove = win.document.onmousemove;
    win.scGeckoDocumentMouseUp = win.document.onmouseup;

    this.getAllDocuments(top).each(function (doc) {
      doc.onclick = scGeckoDispatchCapturedEvent;
      doc.onmousedown = scGeckoDispatchCapturedEvent;
      doc.onmousemove = scGeckoDispatchCapturedEvent;
      doc.onmouseup = scGeckoDispatchCapturedEvent;
    });
  }
  catch (err) { }

  for (var n = 0; n < win.frames.length; n++) {
    this.setCaptureWindow(win.frames[n], control);
  }
}

scBrowser.prototype.removeChild = function(tag) {
  if (tag != null && tag.parentNode != null) {
    tag.parentNode.removeChild(tag);
  }
}

scBrowser.prototype.setImageSrc = function(img, src) {
  img.src = src;
}

scBrowser.prototype.setOuterHtml = function(control, html) {
  var range = control.ownerDocument.createRange();

  range.setStartBefore(control);

  var fragment = range.createContextualFragment(html);

  control.parentNode.replaceChild(fragment, control);
}

scBrowser.prototype.showModalDialog = function (url, arguments, features, request, callback) {
  this.showjQueryModalDialog(url, arguments, features, request, callback);
}

scBrowser.prototype.showPopup = function (data) {
  var id = data.id;

  var evt = (scForm.lastEvent != null ? scForm.lastEvent : event);

  this.clearEvent(evt, true, false);

  var doc = document;
  if (scForm.lastEvent != null && scForm.lastEvent.target != null) {
    doc = scForm.lastEvent.target.ownerDocument;
  }

  /*
  var popupTrapper = document.createElement("div");
  popupTrapper.style.position = "absolute";
  popupTrapper.style.right = "0px";
  popupTrapper.style.bottom = "0px";
  popupTrapper.style.left = "0px";
  popupTrapper.style.top = "0px";
  popupTrapper.style.background = "red";
  popupTrapper.onClick = "javascript: alert('1')";
  */

  var popup = document.createElement("div");

  popup.id = "Popup" + (window.top.popups != null ? window.top.popups.length + 1 : 0);
  popup.className = "scPopup";
  popup.style.position = "absolute";
  popup.style.left = "0px";
  popup.style.top = "0px";
  popup.onBlur = "scForm.browser.removeChild(this.parentNode)";

  var html = "";

  if (typeof (data.value) == "string") {
    html = data.value;
  }
  else {
    html = this.getOuterHtml(data.value);

    var p = html.indexOf(">");
    if (p > 0) {
      html = html.substring(0, p).replace(/display[\s]*\:[\s]*none/gi, "") + html.substr(p);
      html = html.substring(0, p).replace(/position[\s]*\:[\s]*absolute/gi, "") + html.substr(p);
    }
  }

  popup.innerHTML = html;

  document.body.appendChild(popup);
  // popupTrapper.appendChild(popup);
  var width = popup.offsetWidth;
  var height = popup.offsetHeight;

  var ctl = null;
  var x = evt.clientX != null ? evt.clientX : 0;
  var y = evt.clientY != null ? evt.clientY : 0;

  if (id != null && id != "") {
    ctl = scForm.browser.getControl(id, doc);

    if (ctl != null) {
      ctl = $(ctl);

      var dimensions = ctl.getDimensions();

      if (dimensions.width > 0) {
        switch (data.where) {
          case "contextmenu":
            x = evt.pageX;
            y = evt.pageY;
            break;

          case "left":
            x = -width;
            y = 0;
            break;

          case "right":
            x = dimensions.width - 3;
            y = 0;
            break;

          case "above":
            x = 0;
            y = -height + 1;
            break;

          case "below-right":
            x = dimensions.width - width;
            y = dimensions.height;
            break;

          case "dropdown":
            x = 0;
            y = dimensions.height;
            width = dimensions.width;
            break;

          default:
            x = 0;
            y = dimensions.height;
        }

        var vp = ctl.viewportOffset();
        x += vp.left;
        y += vp.top;
      }
    }
  }

  var viewport = document.body;
  if (viewport.clientHeight == 0) {
    var form = $$("form")[0];
    if (form && form.clientHeight > 0) {
      viewport = form;
    }
  }

  if (x + width > viewport.clientWidth) {
    x = document.body.clientWidth - width;
  }
  if (y + height > viewport.clientHeight) {
    y = viewport.clientHeight - height;
  }
  if (x < 0) {
    x = 0;
  }
  if (y < 0) {
    y = 0;
  }

  if (height > viewport.clientHeight) {
    height = viewport.clientHeight;
    var scrolWidth = getScrollBarWidth();
    width += scrolWidth;
    if (x > scrolWidth && navigator.userAgent.indexOf('Firefox') < 0) {
      x -= scrolWidth;
    }
    popup.style.overflow = "auto";
  }

  popup.style.width = "" + width + "px";
  popup.style.height = "" + height + "px";
  popup.style.top = "" + y + "px";
  popup.style.left = "" + x + "px";
  popup.style.zIndex = (window.top.popups == null ? 1000 : 1000 + window.top.popups.length);

  if (window.top.popups != null) {
    window.top.popups.push(popup);
  }
  else {
    window.top.popups = new Array(popup);
  }

  var parentPopup = this.findParentPopup(evt);
  if (parentPopup) {
    popup.scParentPopup = parentPopup;

    var exclusions = new Array();
    var iterator = popup;

    while (iterator) {
      exclusions.push(iterator);
      iterator = $(iterator.scParentPopup);
    }
  }

  this.closePopups("show popup", exclusions || new Array(popup));

  scForm.focus(popup);
}

scBrowser.prototype.findParentPopup = function(evt) {
  if (!window.top.popups || !evt || !evt.target || !evt.target.descendantOf) {
    return;
  }
  
  var target = evt.target;

  return window.top.popups.find(function (popup) { return target.descendantOf(popup); });
}

scBrowser.prototype.swapNode = function(control, withControl) {
  var parent = control.parentNode;

  var clone = control.cloneNode(true);
  
  withControl = parent.replaceChild(clone, withControl);
  
  parent.replaceChild(withControl, control);
  parent.replaceChild(control, clone);
  
  clone = null;
}

/* Hacky fix "Characters entered twice in form field in modal dialog under safari 5.1" https://discussions.apple.com/thread/3336946?start=0&tstart=0 */
scBrowser.prototype.fixSafariModalDialogs = function() {
  var ua = navigator.userAgent.toLowerCase();
  if (this.isSafari && window.dialogArguments && ua.indexOf('version/5.1') > -1 && ua.indexOf('windows') > -1) {
    $A(this.getAllDocuments(window)).each(function (element) {
      element.body.onkeydown = function (event) {
        switch (event.keyCode) {
          case 8:  // Backspace
          case 33: // Page up
          case 34: // Page down
          case 35: // End
          case 36: // Home
          case 37: // Left
          case 38: // Up
          case 39: // Rigth
          case 40: // Down
          case 46: // Del
          case 9:  // Tab
            return true;
          default:
            if (!event.ctrlKey) return false;
        }
      }
    });
  }
}

scBrowser.prototype.getAllDocuments = function(win) {
  var result = [win.document];
  for (var i = 0; i < win.frames.length; i++) {
    result = result.concat(this.getAllDocuments(win.frames[i].window))
  }
  return result;
}

/* Hacky fix of FF problems with table layout and td height=100%. Does not work with hidden elements.*/
scBrowser.prototype.adjustFillParentElements = function () {
  if (this.isFirefox) {
    setTimeout(function () {
      try {
        var elements = $$(".scFillParentFF");
        elements.each(function (el) {
          el.addClassName("scTmpCalculateSize");

          // If 'el' parent element is not shown now then its offsetHeight is 0. It would be nice to fix this limitation.
          el.setStyle({ height: el.parentNode.offsetHeight + "px" });
          el.removeClassName("scTmpCalculateSize");
        });
      }
      catch (e) {
        if (window.console) {
          window.console.log("Failed to stretch element to fill its parent height.");
        }
      }
    }, 1);
  }
}

/* fixsize elements */
scBrowser.prototype.initializeFixsizeElements = function (preserveFixSize) {
  this.fixsizeElements = $$(".scFixSize").concat($$(".scFixSizeInitialized"));
  var form = $$("form")[0];

  this.fixsizeElements.each(function (element) {
    var scrollTop = element.scrollTop;
    var scrollLeft = element.scrollLeft;

    element.addClassName("scFixSize");
    element.setStyle({ height: "100%" });

    var elementHeight = element.getHeight();
    if (elementHeight == 0) {
      if (!preserveFixSize && !element.hasClassName("scKeepFixSize")) {
        element.removeClassName("scFixSize");
      }
      return;
    }

    var padding = element.getStyle("padding");
    if (padding != null && padding != "") {
      var result = padding.match(/[0-9]+/gi);
      if (result != null && result.length == 4) {
        elementHeight -= parseInt(result[0], 10) + parseInt(result[2], 10);
      }
    }

    var borderWidth = element.getStyle("border-width");
    var border = element.getStyle("border-style");
    if (border != "none none none none" && borderWidth != null && borderWidth != "" && border != "none") {
      elementHeight -= 2;
    }

    if (element.hasClassName("scFixSize4")) {
      elementHeight -= 4;
    }
    if (element.hasClassName("scFixSize8")) {
      elementHeight -= 8;
    }
    if (element.hasClassName("scFixSize12")) {
      elementHeight -= 12;
    }
    if (element.hasClassName("scFixSize20")) {
      elementHeight -= 20;
    }

    element.scHeightAdjustment = form.getHeight() - elementHeight;
    element.setStyle({ height: elementHeight + "px" });

    element.removeClassName("scFixSize").addClassName("scFixSizeInitialized");

    element.scrollTop = scrollTop;
    element.scrollLeft = scrollLeft;
  });

  if (this.onInitializeElementComplete) {
    for (var k = 0; k < this.onInitializeElementComplete.length; k++) {
      this.onInitializeElementComplete[k]();
    }
  }
}

scBrowser.prototype.resizeFixsizeElements = function() {
  var form = $$("form")[0];
  if (!form) {
    return;
  }

  this.fixsizeElements.each(function (element) {
      var height = form.getHeight() - element.scHeightAdjustment + "px";
      element.setStyle({ height: height });
  });

  var maxHeight = 0;
  var formChilds = form.childNodes;

  for (var i = 0; i != formChilds.length; i++) {
    var elementHeight = formChilds[i].offsetHeight;
    if (elementHeight > maxHeight) {
      maxHeight = elementHeight;
    }
  }

  var formHeight = form.offsetHeight;

  this.fixsizeElements.each(function (element) {
      var height = element.hasClassName('scFixSizeNested')
        ? (form.getHeight() - element.scHeightAdjustment) + 'px'
        : (element.offsetHeight - (maxHeight - formHeight)) + 'px';
      element.setStyle({ height: height });
  });

  /* trigger re-layouting to fix the firefox bug: table is not shrinking itself down on resize */
  scGeckoRelayout();
}

scBrowser.prototype.shouldKeyPressBeCleared = function (evt) {
  if (navigator.userAgent.indexOf('Firefox') < 0) {
    return true;
  }

  if (evt.ctrlKey && (evt.keyCode == 83 || evt.charCode == 115)) { // Ctrl + S should be cleared
    return true;
  }

  return false;
}

scBrowser.prototype.onInitializeElementComplete = [];
scBrowser.prototype.subscribeToInitializeElementCompleteEvent = function (delegate) {
  if (!delegate) {
    return;
  }

  if (!scBrowser.prototype.onInitializeElementComplete) {
    scBrowser.prototype.onInitializeElementComplete = [];
  }

  scBrowser.prototype.onInitializeElementComplete[scBrowser.prototype.onInitializeElementComplete.length] = delegate;
}

function scGeckoEnumerator(collection) {
  this.m_collection = collection;
  this.m_current = 0;
}

scGeckoEnumerator.prototype.atEnd = function() {
  return (this.m_collection == null) || (this.m_current >= this.m_collection.length);
}

scGeckoEnumerator.prototype.item = function() {
  return this.m_collection[this.m_current];
}

scGeckoEnumerator.prototype.moveNext = function() {
  this.m_current++;
}

scGeckoEnumerator.prototype.moveFirst = function() {
  this.m_current = 0;
}

var scGeckoCapturedControl = null;
var scGeckoCapturedEventExecuting = false;
var scGeckoCaptureFunction = null;

function scGeckoDispatchCapturedEvent(evt) {
  if (scGeckoCapturedControl != null && !scGeckoCapturedEventExecuting) {
    scGeckoCapturedEventExecuting = true;

    try {
      if (scGeckoCaptureFunction != null) {
        scGeckoCaptureFunction(scGeckoCapturedControl, evt);
      }
      else {
        scGeckoEvent = document.createEvent('MouseEvents');
        scGeckoEvent.initMouseEvent(evt.type, true, true, window, 0, evt.screenX, evt.screenY, evt.clientX, evt.clientY, false, false, false, false, 0, null);
        scGeckoCapturedControl.dispatchEvent(scGeckoEvent);
      }
    }
    finally {
      scGeckoCapturedEventExecuting = false;
    }

    evt.stopPropagation();
    evt.preventDefault();

    return false;
  }
}

function scGeckoClosePopups(reason) {
  scForm.browser.closePopups(reason || "geckoClosePopups");
}

function scGeckoActivate() {
  var win = window;

  while (win && !win.scWin) {
    if (win == win.parent) {
      break;
    }

    win = win.parent;
  }

  if (win && win.scWin && win.scWin.activate) {
    win.scWin.activate();
  }
}

function scGeckoRelayout() {
  var form = $$("form")[0];
  
  /* trigger re-layouting to fix the firefox bug: table is not shrinking itself down on resize */
  form.setStyle({ opacity: "0.999" });
  
  setTimeout(function() {
    form.setStyle({ opacity: "1" });
  }, 100);
}

function getScrollBarWidth() {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild(inner);

  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild(outer);

  return (w1 - w2);
};