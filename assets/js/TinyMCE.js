/*-------------------------------------------------------------------
 ExtJS form field - a text area with integrated TinyMCE WYSIWYG Editor

 ExtJS Version: 6.5.1
 TinyMCE Version: 4.7.13
 License: LGPL v3 or later, Sencha License

 Author: Oleg Schildt - https://github.com/sdruckerfig/Ext-JS-6-Bootcamp-In-a-Book/tree/master/shared-solutions/TinyMCE
 AdaptedBy: Andres Arenas
 -------------------------------------------------------------------*/
Ext.define('Gm.wd.tinymce.TinyMCE', {

	//-----------------------------------
	// Alias / Extend
	//-----------------------------------

	extend: 'Ext.form.field.TextArea',
	alias: 'widget.tinymce',

	//-----------------------------------
	// Main Config
	//-----------------------------------

	tinyMCEConfig: {
		menubar: false,
		toolbar_items_size: 'medium',
		//content_css: "contents.css",
		plugins: [
			"advlist autolink lists link image preview hr anchor pagebreak code",
			"media nonbreaking save table contextmenu directionality textcolor",
			"searchreplace wordcount visualblocks visualchars paste fullscreen paste link contextmenu"
		],
		toolbar1: "undo redo | cut copy paste | link unlink image media code table hr | fontselect fontsizeselect | fullscreen",
		toolbar2: "bold italic underline strikethrough subscript superscript | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | removeformat visualchars visualblocks nonbreaking pagebreak"
	},

	//-----------------------------------
	// Properties
	//-----------------------------------

	wysiwygIntialized: false, // Flag for tracking the initialization state
	intializationInProgress: false,
	lastHeight: null,
	lastFrameHeight: null,
	noWysiwyg: false, //This properties enables starting without WYSIWYG editor. The user can activate it later if he wants.
	liquidLayout: false,

	//-----------------------------------
	// Methods
	//-----------------------------------

	/**
	 *
	 */
	afterRender: function () {
		var me = this;

		me.callParent(arguments);
		me.on('blur', function(elm, ev, eOpts) {
			var ctrl = document.getElementById(me.getInputId());

			if (me.wysiwygIntialized) {
				var ed = tinymce.get(me.getInputId());
				// In the HTML text modus, the contents should be synchronized upon the blur event.
				if (ed && ed.isHidden()) {
					if (ctrl) {
						me.positionBeforeBlur = {
							start: ctrl.selectionStart,
							end: ctrl.selectionEnd
						};
					}
					ed.load();
				}
			}
			else {
				if (ctrl) {
					me.positionBeforeBlur = {
						start: ctrl.selectionStart,
						end: ctrl.selectionEnd
					};
				}
			}
		}, me);

		me.on('resize', function(elm, width, height, oldWidth, oldHeight, eOpts) {
			if (!me.noWysiwyg && !me.wysiwygIntialized) {
				me.initEditor(height);
			}
			else {
				me.syncEditorHeight(height);
			}
		}, me);
	},

	/**
	 *
	 */
	syncEditorHeight: function(height) {
		var me = this;
		me.lastHeight = height;

		if (!me.wysiwygIntialized || !me.rendered) {
			return;
		}
		var ed = tinymce.get(me.getInputId());

		// if the editor is hidden, we do not syncronize
		// because the size values of the hidden editor
		// are calculated wrong.
		if (ed.isHidden()) {
			return;
		}

		var edIframe = Ext.get(me.getInputId() + "_ifr");

		var parent = edIframe.up(".mce-edit-area");
		parent = parent.up(".mce-container-body");

		var newHeight = height;

		var edToolbar = parent.down(".mce-toolbar-grp");
		if (edToolbar)
			newHeight -= edToolbar.getHeight();

		var edMenubar = parent.down(".mce-menubar");
		if (edMenubar)
			newHeight -= edMenubar.getHeight();

		var edStatusbar = parent.down(".mce-statusbar");
		if (edStatusbar)
			newHeight -= edStatusbar.getHeight();

		me.lastFrameHeight = newHeight - 3;

		edIframe.setHeight(newHeight - 3);

		return newHeight - 3;
	},

	/**
	 *
	 */
	showBorder: function (state) {
		var me = this;

		var elm = Ext.getDom(me.getId() + "-inputWrap");
		if (!elm) return;

		if (state) elm.classList.remove("tinymce-hide-border");
		else elm.classList.add("tinymce-hide-border");

		var elm = Ext.getDom(me.getId() + "-triggerWrap");
		if (!elm) return;

		if (state) elm.classList.remove("tinymce-hide-border");
		else elm.classList.add("tinymce-hide-border");
	},

	/**
	 *
	 */
	initEditor: function(height) {
		var me = this;

		if (me.noWysiwyg || me.intializationInProgress || me.wysiwygIntialized) {
			return;
		}

		me.intializationInProgress = true;
		if (!me.tinyMCEConfig) {
			me.tinyMCEConfig = {};
		}
		else {
			// We need clone, not reference.
			// The configuration of the wysiwyg might be passed as an object to
			// many editor instances. Through cloning, we prevent
			// side effects on other editors upon internal modifications
			// of the tinyMCEConfig
			var tmp_cfg = me.tinyMCEConfig;
			me.tinyMCEConfig = {};
			Ext.Object.merge(me.tinyMCEConfig, tmp_cfg);
		}

		me.tinyMCEConfig.mode = "exact";
		me.tinyMCEConfig.resize = false;
		me.tinyMCEConfig.elements = me.getInputId();

		if (me.lastFrameHeight) {
			me.tinyMCEConfig.height = me.lastFrameHeight;
		} else {
			me.tinyMCEConfig.height = 30;
		}

		if (me.readOnly) {
			me.tinyMCEConfig.readonly = true;
		}

		if (me.isDisabled()) {
			me.tinyMCEConfig.readonly = true;
		}

		// This provides that the editor get focus
		// by click on the label

		if (me.labelEl) {
			me.labelEl.on('click', function(ev, elm, opts) {
				me.focus(false);
			}, me.labelEl);
		}

		// We have to override the setup method of the TinyMCE.
		// If the user has define own one, we shall not loose it.
		// Store it and call it after our specific actions.
		var user_setup = null;

		if (me.tinyMCEConfig.setup) {
			user_setup = me.tinyMCEConfig.setup;
		}

		// BEGIN: setup
		me.tinyMCEConfig.setup = function(ed) {

			ed.on('init', function(e) {
				me.wysiwygIntialized = true;
				me.intializationInProgress = false;

				me.showBorder(false);

				// This piece of code solves the problem of change propagation so that
				// there is no need to call triggerSave

				var setContent = ed.setContent;
				ed.setContent = function() {
					setContent.apply(ed, arguments);
					ed.fire('change', {});
				};

				if (height) {
					// setTimeout is a hack. The problem is that the editor
					// it not realle ready, when init fires.
					setTimeout(function() {
						me.syncEditorHeight(height);
					}, 200);
				}
			});

			// Catch and propagate the change event
			if (me.bind && me.bind.value) {
				var ev = 'blur';
			} else {
				var ev = 'change';
			}

			ed.on(ev, function(e) {
				var oldval = me.getValue();
				var newval = ed.getContent();

				ed.save();

				me.fireEvent('change', me, newval, oldval, {});
				me.checkDirty();

				if (me.validateOnChange) {
					me.validate();
				}
			});

			// This ensures that the focusing the editor
			// bring the parent window to front

			ed.on('focus', function(e) {
				var w = me.findParentByType('window');
				if (w) w.toFront(true);
			});

			if (user_setup) {
				user_setup(ed);
			}

		};
		// END: setup
		tinymce.init(me.tinyMCEConfig);
		me.intializationInProgress = false;
		me.wysiwygIntialized = true;
	},

	/**
	 *
	 */
	getEditor: function() {
		return this;
	},

	/**
	 *
	 */
	isEditorHidden: function() {
		var me = this;

		if (!me.wysiwygIntialized) {
			return true;
		}

		var ed = tinymce.get(me.getInputId());
		if (!ed) {
			return true;
		}

		return ed.isHidden();
	},

	/**
	 *
	 */
	showEditor: function() {
		var me = this;

		me.storedCursorPosition = null;

		if (!me.wysiwygIntialized) {
			me.noWysiwyg = false;
			me.initEditor(me.getHeight());
			return;
		}

		var ed = tinymce.get(me.getInputId());
		if (!ed) {
			return;
		}

		ed.show();
		me.showBorder(false);
		ed.nodeChanged();
		if (me.lastHeight) {
			me.syncEditorHeight(me.lastHeight);
		}
		me.focus();
	},

	/**
	 *
	 */
	hideEditor: function() {
		var me = this;

		if (!me.wysiwygIntialized) {
			return;
		}

		var ed = tinymce.get(me.getInputId());
		if (!ed) {
			return;
		}

		var node = ed.selection.getNode();

		if (!node || node.nodeName === "#document" || node.nodeName === "BODY" || node.nodeName === "body") {
			ed.hide();
			me.showBorder(true);

			return;
		}

		// otherwise try to position the cursor
		var marker = '<a id="_____sys__11223___"></a>';

		ed.selection.collapse(true);
		ed.execCommand('mceInsertContent', 0, marker);

		ed.hide();
		me.showBorder(true);

		var ctrl = document.getElementById(me.getInputId());

		var pos = -1;
		var txt = "";

		if (ctrl) {
			txt = ctrl.value;
			pos = txt.indexOf(marker);
		}

		if (pos !== -1) {
			var re = new RegExp(marker, "g");
			txt = txt.replace(re, "");
			ctrl.value = txt;

			if (ctrl.setSelectionRange) {
				ctrl.focus();
				ctrl.setSelectionRange(pos, pos);
			}
		}
	},

	/**
	 *
	 */
	toggleEditor: function() {
		var me = this;

		if (!me.wysiwygIntialized) {
			me.showEditor();
			return;
		}

		var ed = tinymce.get(me.getInputId());

		if (ed.isHidden()) {
			me.showEditor();
		} else {
			me.hideEditor();
		}
	},

	/**
	 *
	 */
	removeEditor: function() {
		var me = this;

		if (me.intializationInProgress) {
			return me;
		}

		if (!me.wysiwygIntialized) {
			return me;
		}

		var ed = tinymce.get(me.getInputId());
		if (ed) {
			ed.save();
			ed.destroy(false);

			var edIframe = Ext.get(me.getInputId() + "_ifr");
			if (edIframe) edIframe.destroy();

			me.showBorder(true);
		}

		me.wysiwygIntialized = false;

		return me;
	},

	/**
	 * Sometimes, the editor should be reinitilized on the fly, e.g.
	 * if the body css has been changed (in a CMS the user changed
	 * the design template of a page opened in the editor).
	 * This method removes the editor from the textarea, adds the
	 * changed properties to the base config object and initializes
	 * the editor again.
	 */
	reinitEditor: function(cfg) {
		var me = this;

		if (me.noWysiwyg || me.intializationInProgress) {
			return me;
		}

		if (!me.tinyMCEConfig) {
			me.tinyMCEConfig = {};
		}
		if (!cfg) {
			cfg = {};
		}


		Ext.apply(me.tinyMCEConfig, cfg);

		if (!me.wysiwygIntialized) {
			return me;
		}

		var hidden = true;

		var ed = tinymce.get(me.getInputId());
		if (ed) {
			hidden = ed.isHidden();
			ed.save();

			var edIframe = Ext.get(me.getInputId() + "_ifr");
			if (edIframe) edIframe.destroy();

			ed.destroy(false);
		}

		me.wysiwygIntialized = false;

		if (!hidden) {
			me.initEditor(me.getHeight());
		}

		return me;
	},

	/**
	 *
	 */
	setValue: function (v) {
		var me = this;
		var res = me.callParent(arguments);

		if (me.wysiwygIntialized) {
			// The editor does some preformatting of the HTML text
			// entered by the user.
			// The method setValue sets the value of the textarea.
			// We have to load the text into editor for the
			// preformatting and then to save it back to the textarea.

			var ed = tinymce.get(me.getInputId());
			if (ed) {
				ed.load();
				ed.save();
			}
		}

		return res;
	},

	/**
	 *
	 */
	focus: function(selectText, delay) {
		var me = this;

		if (me.isDisabled()) {
			return me;
		}

		if (delay) {
			if (isNaN(delay)) {
				delay = 10;
			}

			setTimeout(function() {
				me.focus.call(me, selectText, false);
			}, delay);
			return me;
		}

		if (!me.wysiwygIntialized) {
			return me.callParent(arguments);
		}

		var ed = tinymce.get(me.getInputId());
		if (ed && !ed.isHidden()) {
			me.callParent(arguments);

			ed.focus();
		} else {
			return me.callParent(arguments);
		}

		return me;
	},

	/**
	 *
	 */
	enable: function(silent) {
		var me = this;
		var result = me.callParent(arguments);

		if (!result) {
			return result;
		}

		if (me.tinyMCEConfig.readonly) {
			me.reinitEditor({
				readonly: false
			});
		}

		return result;
	},
	//-----------------------------------------------------------------
	disable: function(silent) {
		var me = this;
		var result = me.callParent(arguments);

		if (!result) {
			return result;
		}

		if (!me.tinyMCEConfig.readonly) {
			me.reinitEditor({
				readonly: true
			});
		}

		return result;
	},

	/**
	 *
	 */
	setReadOnly: function(readOnly) {
		var me = this;
		var result = me.callParent(arguments);

		if (readOnly !== me.tinyMCEConfig.readonly) {
			me.reinitEditor({
				readonly: readOnly
			});
		}

		return result;
	},

	/**
	 *
	 */
	storeCurrentSelection: function() {
		var me = this;
		var wwg_mode = false;
		var ed = tinymce.get(me.getInputId());

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());
		if (wwg_mode) {
			me.storedCursorPosition = ed.selection.getBookmark('simple');
		}
		else if (ctrl) {
			me.storedCursorPosition = me.positionBeforeBlur;
		}
	},

	/**
	 *
	 */
	restoreCurrentSelection: function() {
		var me = this;

		if (!me.storedCursorPosition) {
			return;
		}

		var wwg_mode = false;
		var ed = tinymce.get(me.getInputId());

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());

		if (wwg_mode) {
			ed.selection.moveToBookmark(me.storedCursorPosition);
		} else if (ctrl) {
			ctrl.setSelectionRange(me.storedCursorPosition.start, me.storedCursorPosition.end);
		}
	},

	/**
	 *
	 */
	insertText: function(txt) {
		var me = this;
		var wwg_mode = false;
		var ed = tinymce.get(me.getInputId());

		if (me.wysiwygIntialized) {
			if (ed && !ed.isHidden()) {
				wwg_mode = true;
			}
		}

		var ctrl = document.getElementById(me.getInputId());
		if (wwg_mode) {
			ed.focus();
			ed.execCommand('mceInsertContent', 0, txt);
		}
		else if (ctrl) {
			ctrl.focus();
			var start = ctrl.selectionStart + txt.length;
			ctrl.value = ctrl.value.slice(0, ctrl.selectionStart) + txt + ctrl.value.slice(ctrl.selectionEnd);

			ctrl.setSelectionRange(start, start);
		}
	},

	/**
	 *
	 */
	beforeDestroy: function() {
		var me = this;
		var ed = tinymce.get(me.getInputId());

		if (ed) ed.destroy(false);
	},

	/**
	 *
	 */
	renderActiveError: function() {
		var me = this,
			activeError = me.getActiveError(),
			hasError = !!activeError;

		var edIframe = Ext.get(me.getInputId() + "_ifr");
		if (!edIframe) {
			return me.callParent(arguments);
		}

		var ed = tinymce.get(me.getInputId());
		if (!ed) {
			return me.callParent(arguments);
		}

		var parent = edIframe.up(".mce-edit-area");
		parent = parent.up(".mce-container-body");

		if (!parent) {
			return me.callParent(arguments);
		}

		parent = parent.up(".mce-tinymce");

		if (!parent) {
			return me.callParent(arguments);
		}

		if (me.rendered && !me.isDestroyed && !me.preventMark) {
			var evHandler = function(args) {
				me.clearInvalid();
			};

			// Add/remove invalid class
			if (hasError) {
				parent.addCls('tinymce-error-field');

				ed.on('keydown', evHandler);
				ed.on('change', evHandler);
			} else {
				parent.removeCls('tinymce-error-field');

				ed.off('keydown', evHandler);
				ed.off('change', evHandler);
			}
		}
		return true;
	}
});