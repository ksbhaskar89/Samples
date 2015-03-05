function SlowClickGui() {
}

SlowClickGui.prototype = {
	
   TAMPER : "tamper",
   ABORT  : "abort",
   SUBMIT : "submit",

   start: function(view) {
      this.requestList  = document.getElementById("request list");
      this.responseList = document.getElementById("response list");
      this.filterInput  = document.getElementById("slowclicks.filter.input");
      this.tree         = new TamperOutputTree(view, this);
   },

   stop: function() {
      this.tree         = null;
      this.requestList  = null;
      this.responseList = null;
   },


   myHasVisibleData : false,
   myHasData        : false,
   myHasFilter      : false,

   set hasVisibleData(flag) {
      if (flag != this.myHasVisibleData) {
         this.myHasVisibleData = flag;
         this.enableDataCommands(flag);
      }
   },

   set hasData(flag) {
      if (flag != this.myHasData) {
         this.myHasData = flag;
         this.enableClearCommand(flag);
      }
   },

   set hasFilter(flag) {
      if (flag != this.myHasFilter) {
         this.myHasFilter = flag;
         this.enableFilterCommands(flag);
      }
   },

   selectionChange : function() {
      this.clearListWithHeaders(this.requestList);
      this.clearListWithHeaders(this.responseList);
      var item = this.tree.getCurrent();
      if (item != null) {
         this.addRequestData(item);
         this.addResponseData(item);
      }
   },

   getItemStringValue : function(list, index) {
      var retVal = "";
      if (index == -1) {
         index = list.selectedIndex;
      }
      if (index >= 0) {
         var item = list.getItemAtIndex(index);
         if (item) {
            var name = item.getAttribute("slowclicks.name");
            var value = item.getAttribute("slowclicks.value");
            retVal = name + "=" + value;
         }
      }
      return retVal;
   },

   requestCommands : new Array("slowclicks.request.copy.selection", "slowclicks.request.details"),

   requestSelectionChange : function() {
      var item = this.requestList.selectedItem;
      this.enableCommands(this.requestCommands, item != null);
   },

   requestDoubleClick : function() {
      var item = this.requestList.selectedItem;
      if (item != null) {
         var name = item.getAttribute("slowclicks.name");
         var value = item.getAttribute("slowclicks.value");
         window.openDialog("chrome://slowclickdata/content/TamperDetailsDlg.xul", "Response Details - " + name, "chrome,resizable=yes,scrollbars=yes,status=yes", name, value);
      }
   },

   requestCopySelection : function() {
      TamperUtils.copyToClipboard(this.getItemStringValue(this.requestList, -1));
   },

   requestCopyAll : function() {
      var rows = this.requestList.getRowCount();
      var retVal = "";
      for (var index = 0; index < rows; index++) {
         retVal += this.getItemStringValue(this.requestList, index) + "\n";
      }
      TamperUtils.copyToClipboard(retVal);
   },

   responseCommands : new Array("slowclicks.response.copy.selection", "slowclicks.response.details"),

   responseSelectionChange : function() {
      var item = this.responseList.selectedItem;
      this.enableCommands(this.responseCommands, item != null);
   },

   responseDoubleClick : function() {
      var item = this.responseList.selectedItem;
      if (item != null) {
         var name = item.getAttribute("slowclicks.name");
         var value = item.getAttribute("slowclicks.value");
         window.openDialog("chrome://slowclickdata/content/TamperDetailsDlg.xul", "Response Details - " + name, "chrome,resizable=yes,scrollbars=yes,status=yes", name, value);
      }
   },

   responseCopySelection : function() {
      TamperUtils.copyToClipboard(this.getItemStringValue(this.responseList, -1));
   },

   responseCopyAll : function() {
      var rows = this.responseList.getRowCount();
      var retVal = "";
      for (var index = 0; index < rows; index++) {
         retVal += this.getItemStringValue(this.responseList, index) + "\n";
      }
      TamperUtils.copyToClipboard(retVal);
   },

   doubleClick : function() {
      var item = this.tree.getCurrent();
      if (item != null) {
         window.openDialog("chrome://slowclickdata/content/TamperDetailsDlg.xul", "Response Details - " + name, "chrome,resizable=yes,scrollbars=yes,status=yes", "URL", item.uri);
      }
   },

   clearListWithHeaders : function(list) {
      var nodes = list.getElementsByTagName("listitem");
      var count = nodes.length;
      for (var i = count - 1; i >= 0; i--) {
         list.removeChild(nodes.item(i));
      }
   },

   addRequestData : function(item) {
      if (item.requestHeaders != null) {
         // add request row here?
         for(var header in item.requestHeaders) {
            this.addRequestRow(header, item.requestHeaders[header]);
         }
         if (item.getPostData() != null) {
            for(header in item.postBodyHeaders) {
               this.addRequestRow(header, item.postBodyHeaders[header]);
            }
            if (!item.isPostDataBinary()) {
               this.addRequestRow("POSTDATA", item.getPostData());
            } else {
               // evil hack to prevent details dialog from parsing values
               // there should be a better way...
               this.addRequestRow("POSTDATA" + " ", item.getPostData());
            }
         }
      }
   },

   addRequestRow : function(name, value) {
      this.addDetailRow(this.requestList, name, value);
   },

   addDetailRow : function(parent, name, value) {
      var item = document.createElement('listitem');
      item.setAttribute("slowclicks.name", name);
      item.setAttribute("slowclicks.value", value);
      item.appendChild(this.createCell(name));
      item.appendChild(this.createCell(value));
      item.setAttribute("tooltipText", value);
      parent.appendChild(item);
   },

   createCell : function(text) {
      var cell = document.createElement("listcell");
      cell.setAttribute("label", text);
      return cell;
   },

   addResponseData : function(item) {
      if (item.responseHeaders != null) {
         this.addResponseRow("Status", item.statusText + " - " + item.status);
         for(var header in item.responseHeaders ) {
            this.addResponseRow(header, item.responseHeaders [header]);
         }
      }
   },

   addResponseRow : function(name, value) {
      this.addDetailRow(this.responseList, name, value);
   },

   // For Starting and stopping the slow click analysis
   toggleTampering : function(value) {
      var startCommand = document.getElementById('slowclicks.start');
      var stopCommand = document.getElementById('slowclicks.stop');
      if (value) {
         startCommand.setAttribute("disabled", "true");
         stopCommand.removeAttribute("disabled");
      } else {
         startCommand.removeAttribute("disabled");
         stopCommand.setAttribute("disabled", "true");
      }
   },

   confirm : function(uri) {
      var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
      // n.b. on windows, button position 2 is always in the middle - very odd, I think
      // it has to do with a magic value that gets used for cancel.
      var flags=promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_0 +
                promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_1 +
                promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_2;
      
      // display the dialog box. The flags set above are passed
      // as the fourth argument. The next three arguments are custom labels used for the buttons
      var continueTampering = {};
      continueTampering.value = true;
      // if the uri is really big it can push the buttons off the window, so truncate it
      if (uri.length > 100) {
         uri = uri.substring(0, 100) + "...";
      }
      var retVal = promptService.confirmEx(
                      window,
                      this.langString("slowclicks.prompt"),
                      uri + "\n",
                      flags, 
                      this.langString("tamper"), 
                      this.langString("slowclicks.abort"),
                      this.langString("slowclicks.submit"),
                      this.langString("slowclicks.continue"),
                      continueTampering);   

      if (!continueTampering.value) {
         oslowclicks.isTampering = false;
      }
      if (retVal == 0) {
         return this.TAMPER;
      } else if (retVal == 1) {
         return this.ABORT;
      } else {
         return this.SUBMIT;
      }
   },

   commands : new Array("slowclicks.copy.selection", "slowclicks.copy.all", "slowclicks.export.xml", "slowclicks.export.all.xml", "slowclicks.show.graph", "slowclicks.show.graph.all", "slowclicks.details", "slowclicks.reopen", "slowclicks.viewSource", "slowclicks.replay"),

   enableDataCommands : function(enable) {
      this.enableCommands(this.commands, enable);
   },

   enableCommands : function(commandArray, enable) {
      for (var id in commandArray) {
         this.enableCommand(commandArray[id], enable);
      }
   },

   enableCommand : function(id, enable) {
      var command = document.getElementById(id);
      if (enable) {
         command.removeAttribute("disabled");
      } else {
         command.setAttribute("disabled", "true");
      }
   },

   enableClearCommand : function(enable) {
      this.enableCommand("clear.output", enable);
   },

   enableFilterCommands : function(enable) {
      this.enableCommand("slowclicks.clearFilter", enable);
   },

   copySelection : function() {
      TamperUtils.copyToClipboard(this.tree.getText(false));
   },

   copyAll : function() {
      TamperUtils.copyToClipboard(this.tree.getText(true));
   },

   reOpen : function() {
      var item = this.tree.getCurrent();
      if (item != null) {
         // var uri = SlowClickGui.modifyUri(item.uri);
         if (item.uri) {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]. getService(Components.interfaces.nsIWindowMediator);
            var win = wm.getMostRecentWindow("navigator:browser");
            win.gBrowser.selectedTab = win.gBrowser.addTab(item.uri);
         }
      }
   },

   // like reOpen, but we preserve the original headers, post data etc.
   replay : function() {
      var item = this.tree.getCurrent();
      if (item != null) {
         var uri = SlowClickGui.modifyUri(item.uri);
         if (uri) {
            var loadFlags = Components.interfaces.nsIRequest.LOAD_FLAGS_NONE;
            if (item.mustValidate()) {
               loadFlags = Components.interfaces.nsIRequest.MUST_VALIDATE;
            }
            // tell our main object about it, as we will need to replace the headers with our old
            // copy
            oslowclicks.addToReplayList(uri, item);
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]. getService(Components.interfaces.nsIWindowMediator);
            var win = wm.getMostRecentWindow("navigator:browser");
            win.gBrowser.selectedTab = win.gBrowser.addTab("about:blank");
            // we don't bother with the headers here, as the browser adds stuff anyway
            // we deal with them in oslowclicks.onModifyRequest()
            win.gBrowser.webNavigation.loadURI(uri, 
                                               loadFlags,
                                               item.getRefererURI(),
                                               item.getPostDataStream(),
                                               null);
         }
      }
   },
   
   clear : function(tamper) {
      // the data has been emptied, tell the tree
      this.tree.data = tamper;
      this.enableClearCommand(false);
   }, 

   currentFilter : null,

   filterData : function() {
      this.currentFilter = this.filter;
      this.tree.filter(this.currentFilter);
      if (this.currentFilter != null && this.currentFilter != "") {
         this.hasFilter = true;
      } else {
         this.hasFilter = false;
      }
   },

   get filter() {
      return this.filterInput.value;
   },

   clearFilter : function() {
      this.filterInput.value = null;
      this.filterData();
   },

   showGraph : function(all) {
      // extract the xml
      var graphTitle = "Requests Graph";
      var graph = new TamperGraph(graphTitle, this.tree.getXML(all));
      var graphText = graph.getHTML();

      var win = window.open("data:text/html;charset=utf-8," + graphText, "Request Graph", "menubar=yes,resizable=yes,scrollbars=yes,status=no,dependent=yes,width=750,height=500");
      // win.document.write causes a security violation
   },

   exportXML : function() {
      TamperUtils.writeFile(this.langString("select.file"), this.tree.getXML(false));
   },

   exportAllXML : function() {
      TamperUtils.writeFile(this.langString("select.file"), this.tree.getXML(true));
   }
};