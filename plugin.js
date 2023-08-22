'use strict';

( function() {
	function configFmath() {
		if (!Object.prototype.hasOwnProperty.call(window, 'FMATH')) {
			setTimeout(configFmath, 30);
			return;
		}
		FMATH.ApplicationConfiguration.Ah( pluginPath + '/editor/fmath/fonts');
		FMATH.ApplicationConfiguration.Aj(pluginPath  + '/editor/fmath/glyphs');
		window.FMath_dialog_config = { folderUrlForFonts: pluginPath  + '/editor/fmath/fonts', folderUrlForGlyphs: pluginPath + '/FMathEditor/editor/fmath/glyphs' };
	}
	configFmath();
	var pluginPath = CKEDITOR.plugins.getPath('FMathEditor');
	var altPrefix = 'MathML (base64):';

	CKEDITOR.plugins.add('FMathEditor', {
		requires: 'dialog,fakeobjects',
		icons: 'FMathEditor',
		init: function (editor) {
			editor.addCommand('viewMathEditor', new CKEDITOR.dialogCommand('FMathEditorDialog'));

			editor.ui.addButton('FMathEditor', {
				label: 'Math Editor',
				command: 'viewMathEditor',
				toolbar: 'insert'
			});
			if (editor.contextMenu) {
				editor.addMenuGroup('mathGroup');
				editor.addMenuItem('mathEditorItem', {
					label: 'Edit Math',
					icon: this.path + 'icons/FMathEditor.png',
					command: 'viewMathEditor',
					group: 'mathGroup'
				});

				editor.contextMenu.addListener(function (element) {
					if (element.getAscendant('img', true)) {
						return { mathEditorItem: CKEDITOR.TRISTATE_OFF };
					}
				});
			}

			CKEDITOR.dialog.add('FMathEditorDialog', this.path + 'dialogs/dialog.js');
		},
		afterInit: function (editor) {
			editor.dataProcessor.dataFilter.addRules({
				elements: {
					math: function (element) {
						return CKEDITOR.plugins.fmath.createFMathPlaceholder(editor, element);
					}
				}
			});
			editor.dataProcessor.htmlFilter.addRules({
				elements: {
					img: function (element) {
						if (element.attributes.alt && element.attributes.alt.indexOf(altPrefix) === 0) {
							var mathml = window.atob(element.attributes.alt.substr(16));
							var out = CKEDITOR.htmlParser.fragment.fromHtml(mathml);
							if (out && out.children.length === 1) {
								out = out.children[0];
							}
							return out;
						}
					}
				}
			});
			var pathFilters = editor._.elementsPath && editor._.elementsPath.filters;
			if (pathFilters) {
				pathFilters.push(function (element, name) {
					if (name === 'img' && element.getAttribute('alt') && element.getAttribute('alt').indexOf(altPrefix) === 0) {

					}
				});
			}
		},
	});

	CKEDITOR.plugins.fmath = {
		createFMathPlaceholder(editor, element) {
			var formula = new FMATH.MathMLFormula();
			var $dummyCanvas = jQuery('<canvas></canvas>');
			// Get math markup and clean it up.
			var mathml = element
				.getOuterHtml()
				// Mathml doesn't render ÅÄÖ chars that are alone in their tags.
				// Merge these tags with the tag before.
				.replace(/<\/mi><mi>(Å|Ä|Ö|å|ä|ö)<\/mi>/g, '$1</mi>')
				// Encode multibyte characters the way mathml encodes them, ie two rounds of html entities.
				.replace(/[\u0250-\ue007]/g, function (char) {
					return '&amp;#' + char.charCodeAt(0) + ';';
				});

			formula.setFontSize(19);
			formula.setFontBold(false);
			formula.drawImage($dummyCanvas.get(0), mathml);
			var placeholderId = CKEDITOR.tools.getUniqueId();
			var attributes = {
				alt: altPrefix + window.btoa(mathml),
				src: CKEDITOR.tools.transparentImageData,
				id: placeholderId,
				'data-cke-realelement': true,
				class: 'loading'
			};
			var placeholder = new CKEDITOR.htmlParser.element('img', attributes);
			editor.once('contentDom', function () {
				setTimeout(function () {
						var image = formula.getImage('png');
						var element = editor.document.getById(placeholderId);
						if (element) {
							element.setAttribute('src', image).removeClass('loading');
						}
						// Need to wait at least this long or the image is blank.
					}, 1200);
			});
			return placeholder;
		}
	}
})();
