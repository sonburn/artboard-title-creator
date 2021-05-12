var sketch = require("sketch");

// Plugin variables
var pluginName = "Artboard Title Creator",
	pluginDescription = "Create artboard titles for artboards on current page.",
	pluginIdentifier = "com.sonburn.sketchplugins.artboard-title-creator",
	titleDisplayKey = "displayTitle",
	titleGroupKey = "titleGroup",
	titleGroupName = "Artboard Titles",
	titleStyleName = "Artboard Titles",
	titleStyleData = {
		fontFace : "SFProText-Bold",
		fontSize : 18,
		lineHeight : 48,
		textAlignment : 0
	},
	debugMode = false;

var create = function(context,command) {
	// Get title settings
	var titleSettings = getTitleSettings(context,command);

	// If title settings returned...
	if (titleSettings) {
		// Get artboards and create the artboard loop
		var predicate = NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + titleDisplayKey + " != " + false,pluginIdentifier),
			artboards = context.document.currentPage().artboards().filteredArrayUsingPredicate(predicate),
			artboardLoop = artboards.objectEnumerator(),
			artboard;

		// If there are artboards...
		if (artboards.length) {
			// Title group
			var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + titleGroupKey + " == " + true,pluginIdentifier),
				titleGroup = context.document.currentPage().children().filteredArrayUsingPredicate(predicate).firstObject();

			// If title group exists...
			if (titleGroup) {
				// Remove title group
				titleGroup.removeFromParent();
			}

			// Create title group
			titleGroup = MSLayerGroup.new();

			// Modify title group
			titleGroup.setName(titleGroupName);
			titleGroup.setHasClickThrough(true);
			titleGroup.setIsLocked(1);
			titleGroup.frame().setX(0);
			titleGroup.frame().setY(0);

			// Add title group to current page
			context.document.currentPage().addLayers([titleGroup]);

			// Designate title group
			context.command.setValue_forKey_onLayer(true,titleGroupKey,titleGroup);

			// Title style
			var titleStyle = getTextStyle(titleStyleName,titleStyleData);

			// Iterate through the artboards...
			while (artboard = artboardLoop.nextObject()) {
				// Create title layer
				var screenTitle = MSTextLayer.new();

				// Modify title layer
				screenTitle.setStringValue(artboard.name());
				screenTitle.setName(artboard.name());

				// Apply style to title layer
				if (titleStyle.newInstance) {
					screenTitle.setStyle(titleStyle.newInstance());
				} else {
					screenTitle.setSharedStyle(titleStyle);
				}

				// Set title layer X position
				screenTitle.frame().setX(artboard.frame().x());

				// Set title layer Y position
				if (titleSettings.titleLocation == 0) {
					screenTitle.frame().setY(artboard.frame().y() - (titleStyleData.lineHeight + parseInt(titleSettings.titleOffset)));
				} else {
					screenTitle.frame().setY(artboard.frame().y() + artboard.frame().height() + parseInt(titleSettings.titleOffset));
				}

				// Add title layer to title group
				titleGroup.addLayers([screenTitle]);
			}

			// Resize title group
			if (sketch.version.sketch > 52) {
				titleGroup.fixGeometryWithOptions(0);
			} else {
				titleGroup.resizeToFitChildrenWithOption(0);
			}

			// If creating titles directly...
			if (!command) {
				// Display feedback
				context.document.showMessage("Artboard titles created");

				if (!debugMode) googleAnalytics(context,"create","create");
			}
		}
		// If there are no artboards...
		else {
			// Display feedback
			displayDialog(pluginName,"There are no artboard titles to create as there are either no artboards on the current page, or all artboards have been precluded.");
		}
	}
}

var	include = function(context) {
	var predicate = NSPredicate.predicateWithFormat("className == %@","MSArtboardGroup"),
		selections = context.selection.filteredArrayUsingPredicate(predicate),
		count = 0;

	if (selections.count()) {
		var selectionLoop = selections.objectEnumerator(),
			selection;

		while (selection = selectionLoop.nextObject()) {
			context.command.setValue_forKey_onLayer(true,titleDisplayKey,selection);

			count++;
		}

		create(context,"include");

		if (selections.count() == 1) {
			context.document.showMessage(selections.firstObject().name() + " has been included, artboard titles have been re-created");
		} else {
			context.document.showMessage(count + " artboards have been included, artboard titles have been re-created");
		}

		if (!debugMode) googleAnalytics(context,"create","include");
	} else {
		displayDialog(pluginName,"Select artboard(s) to include when creating artboard titles.");
	}
}

var	preclude = function(context) {
	var predicate = NSPredicate.predicateWithFormat("className == %@","MSArtboardGroup"),
		selections = context.selection.filteredArrayUsingPredicate(predicate),
		count = 0;

	if (selections.count()) {
		var selectionLoop = selections.objectEnumerator(),
			selection;

		while (selection = selectionLoop.nextObject()) {
			context.command.setValue_forKey_onLayer(false,titleDisplayKey,selection);

			count++;
		}

		create(context,"preclude");

		if (selections.count() == 1) {
			context.document.showMessage(selections.firstObject().name() + " has been precluded, artboard titles have been re-created");
		} else {
			context.document.showMessage(count + " artboards have been precluded, artboard titles have been re-created");
		}

		if (!debugMode) googleAnalytics(context,"create","preclude");
	} else {
		displayDialog(pluginName,"Select artboard(s) to preclude when creating artboard titles.");
	}
}

var report = function(context) {
	openUrl("https://github.com/sonburn/artboard-title-creator/issues/new");

	if (!debugMode) googleAnalytics(context,"report","report");
}

var plugins = function(context) {
	openUrl("https://sonburn.github.io/");

	if (!debugMode) googleAnalytics(context,"plugins","plugins");
}

var donate = function(context) {
	openUrl("https://www.paypal.me/sonburn");

	if (!debugMode) googleAnalytics(context,"donate","donate");
}

function createAlertWindow(context,name,text) {
	var alertWindow = COSAlertWindow.new();

	var iconPath = context.plugin.urlForResourceNamed("icon.png").path(),
		icon = NSImage.alloc().initByReferencingFile(iconPath);

	alertWindow.setIcon(icon);
	alertWindow.setMessageText(name);
	alertWindow.setInformativeText(text);

	return alertWindow;
}

function createRadioButtons(options,selected,format,x,y) {
	var rows = options.length,
		columns = 1,
		matrixWidth = 300,
		cellWidth = matrixWidth,
		x = (x) ? x : 0,
		y = (y) ? y : 0;

	if (format && format != 0) {
		rows = options.length / 2;
		columns = 2;
		matrixWidth = 300;
		cellWidth = matrixWidth / columns;
	}

	var buttonCell = NSButtonCell.alloc().init();

	buttonCell.setButtonType(NSRadioButton);

	var matrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
		NSMakeRect(x,y,matrixWidth,rows*20),
		NSRadioModeMatrix,
		buttonCell,
		rows,
		columns
	);

	matrix.setCellSize(NSMakeSize(cellWidth,20));

	for (i = 0; i < options.length; i++) {
		matrix.cells().objectAtIndex(i).setTitle(options[i]);
		matrix.cells().objectAtIndex(i).setTag(i);
	}

	matrix.selectCellAtRow_column(selected,0);

	return matrix;
}

function createTextField(value,frame) {
	var field = NSTextField.alloc().initWithFrame(frame);

	field.setStringValue(value);

	return field;
}

function displayDialog(title,body) {
	NSApplication.sharedApplication().displayDialog_withTitle(body,title);
}

function getObjectByName(haystack,needle) {
	for (var i = 0; i < haystack.count(); i++) {
		var objectName = haystack.objectAtIndex(i).name();

		if (objectName && objectName.isEqualToString(needle)) {
			return haystack.objectAtIndex(i);
		}
	}

	return false;
}

function getTextStyle(styleName,styleData) {
	var textStyles = MSDocument.currentDocument().documentData().layerTextStyles(),
		textStyle = getObjectByName(textStyles.objects(),styleName);

	if (!textStyle) {
		var textLayer = MSTextLayer.alloc().initWithFrame(nil);
		textLayer.setFontSize(styleData.fontSize);
		textLayer.setLineHeight(styleData.lineHeight);
		textLayer.setTextAlignment(styleData.textAlignment);
		textLayer.setFontPostscriptName(styleData.fontFace);

		if (textStyles.addSharedStyleWithName_firstInstance) {
			textStyle = textStyles.addSharedStyleWithName_firstInstance(styleName,textLayer.style());
		} else if (textStyles.initWithName_firstInstance) {
			textStyle = MSSharedStyle.alloc().initWithName_firstInstance(styleName,textLayer.style());

			textStyles.addSharedObject(textStyle);
		} else {
			var textStyle = MSSharedStyle.alloc().initWithName_style(styleName,textLayer.style());

			textStyles.addSharedObject(textStyle);
		}
	}

	return textStyle;
}

function getTitleSettings(context,command) {
	// Setting variables
	var defaultSettings = {};
	defaultSettings.titleLocation = 0;
	defaultSettings.titleOffset = 0;

	// Get saved settings
	defaultSettings = getSavedSettings(context,context.document.documentData(),defaultSettings,pluginIdentifier);

	// If no command, operate in config mode...
	if (!command) {
		// Create alert window and fields
		var alertWindow = createAlertWindow(context,pluginName,pluginDescription),
			titleLocation = createRadioButtons(["Above artboards","Below artboards"],defaultSettings.titleLocation),
			titleOffset = createTextField(defaultSettings.titleOffset,NSMakeRect(0,0,60,24));

		// Assemble window
		alertWindow.addAccessoryView(titleLocation);
		alertWindow.addTextLabelWithValue("Vertical offset:");
		alertWindow.addAccessoryView(titleOffset);

		// Add window buttons
		var buttonOK = alertWindow.addButtonWithTitle("OK");
		var buttonCancel = alertWindow.addButtonWithTitle("Cancel");

		// Set key order and first responder
		setKeyOrder(alertWindow,[
			titleLocation,
			titleOffset,
			buttonOK
		]);

		// Display alert window and get response
		var responseCode = alertWindow.runModal();

		// If user pressed OK...
		if (responseCode == 1000) {
			try {
				// Save settings
				context.command.setValue_forKey_onLayer(titleLocation.selectedCell().tag(),"titleLocation",context.document.documentData());
				context.command.setValue_forKey_onLayer(Number(titleOffset.stringValue()),"titleOffset",context.document.documentData());
			}
			catch(err) {
				log("Unable to save settings");
			}

			// Return settings
			return {
				titleLocation : titleLocation.selectedCell().tag(),
				titleOffset : Number(titleOffset.stringValue())
			}
		} else return false;
	}
	// If command, operate in run mode...
	else {
		// Return settings
		return {
			titleLocation : defaultSettings.titleLocation,
			titleOffset : defaultSettings.titleOffset
		}
	}
}

function getSavedSettings(context,location,settings) {
	try {
		for (i in settings) {
			var value = context.command.valueForKey_onLayer(i,location);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log("Unable to fetch settings");
	}
}

function googleAnalytics(context,category,action,label,value) {
	var trackingID = "UA-118222959-1",
		uuidKey = "google.analytics.uuid",
		uuid = NSUserDefaults.standardUserDefaults().objectForKey(uuidKey);

	if (!uuid) {
		uuid = NSUUID.UUID().UUIDString();
		NSUserDefaults.standardUserDefaults().setObject_forKey(uuid,uuidKey);
	}

	var url = "https://www.google-analytics.com/collect?v=1";
	// Tracking ID
	url += "&tid=" + trackingID;
	// Source
	url += "&ds=sketch" + sketch.version.sketch;
	// Client ID
	url += "&cid=" + uuid;
	// pageview, screenview, event, transaction, item, social, exception, timing
	url += "&t=event";
	// App Name
	url += "&an=" + encodeURI(context.plugin.name());
	// App ID
	url += "&aid=" + context.plugin.identifier();
	// App Version
	url += "&av=" + context.plugin.version();
	// Event category
	url += "&ec=" + encodeURI(category);
	// Event action
	url += "&ea=" + encodeURI(action);
	// Event label
	if (label) {
		url += "&el=" + encodeURI(label);
	}
	// Event value
	if (value) {
		url += "&ev=" + encodeURI(value);
	}

	var session = NSURLSession.sharedSession(),
		task = session.dataTaskWithURL(NSURL.URLWithString(NSString.stringWithString(url)));

	task.resume();
}

function openUrl(url) {
	NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
}

function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i],
			nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.alert().window().setInitialFirstResponder(order[0]);
}
