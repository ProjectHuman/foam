/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  name: 'TextFieldView',
  package: 'foam.ui.md',
  extendsModel: 'foam.ui.SimpleView',
  traits: ['foam.ui.md.MDStyleTrait'],

  properties: [
    {
      name: 'className',
      defaultValueFn: function() { return this.resetClassName(); },
    },
    { name: 'data' },
    { name: 'softData' },
    { name: 'inputId' },
    { name: '$input', getter: function() { return this.X.$(this.inputId); } },
    { name: 'labelId' },
    { name: '$label', getter: function() { return this.X.$(this.labelId); } },
    { model_: 'BooleanProperty', name: 'focused', defaultValue: false },
    'prop',
    { name: 'label', defaultValueFn: function() { return this.prop.label; } },
    { model_: 'BooleanProperty', name: 'onKeyMode', defautlValue: false },
    { model_: 'IntProperty', name: 'displayHeight' },
    { model_: 'IntProperty', name: 'displayWidth' },
    {
      model_: 'BooleanProperty',
      name: 'floatingLabel',
      documentation: 'Set true for the floating label (see MD spec) by ' +
          'default, but can be disabled where the label is redundant.',
      defaultValue: true,
      postSet: function(old, nu) {
        if ( old === nu ) return;
        this.resetClassName();
      },
    },
    {
      model_: 'BooleanProperty',
      name: 'growable',
      documentation: 'Set true if this text area should grow with the text.',
      defaultValue: false
    },
    {
      name: 'clearAction',
      documentation: 'When true, will show an X for clearing the text box.',
      defaultValue: false
    },
    {
      name: 'darkBackground',
      defaultValue: false
    },
    {
      name: 'clearIcon',
      defaultValueFn: function() {
        return this.darkBackground ? 'images/ic_cancel_24dp.png' :
            'images/ic_cancel_black_24dp.png';
      }
    },
    {
      name: 'underline',
      documentation: 'When true, draws the underline for the text field.',
      defaultValue: true
    },
    {
      model_: 'StringProperty',
      name: 'mode',
      defaultValue: 'read-write',
      view: {
        factory_: 'foam.ui.ChoiceView',
        choices: ['read-only', 'read-write'],
      },
      documentation: function() { /* Can be 'read-only', or 'read-write'. */},
      postSet: function(old, nu) {
        if ( old === nu ) return;
        this.resetClassName();
        if ( this.$input ) {
          if ( nu === 'read-only' )
            this.$input.setAttribute('disabled', 'true');
          else
            this.$input.removeAttribute('disabled');
        }
      },
    }
  ],
  methods: {
    initHTML: function() {
      this.SUPER();
      this.softValue = DomValue.create(this.$input, 'input',
          this.growable ? 'textContent' : 'value');
      this.softValue.set(this.data);
      Events.link(this.softValue, this.softData$);

      if ( this.onKeyMode ) {
        Events.link(this.data$, this.softData$);
      } else {
        Events.follow(this.data$, this.softData$);
      }
    },
    focus: function() {
      this.$input.focus();
    },
    blur: function() {
      this.$input && this.$input.blur();
    },
    resetClassName: function() {
      // TODO(markdittmer): This should work with events.dynamic() in init(),
      // but that doesn't seem to be working right now.
      this.className = 'md-text-field-container' + (this.floatingLabel ?
          '' : ' md-text-field-no-label') +
          (this.mode == 'read-only' ? ' disabled' : '');
      return this.className;
    },
  },
  templates: [
    function CSS() {/*
      .md-text-field-container {
        align-items: center;
        display: flex;
        position: relative;
      }

      .md-text-field-container.md-style-trait-standard {
        margin: 8px;
        padding: 32px 8px 8px 8px;
      }
      .md-text-field-container.md-style-trait-inline {
        padding: 32px 0px 0px 0px;
        margin: -32px 0px 0px 0px;
      }
      .md-text-field-container.md-text-field-no-label.md-style-trait-inline {
        padding-top: 0px;
        margin: 0px;
      }

      .md-text-field-label {
        position: absolute;
        top: 32px;
        font-size: 14px;
        font-weight: 500;
        color: #999;
        transition: font-size 0.5s, top 0.5s;
        flex-grow: 1;
        z-index: 0;
      }
      .md-text-field-input {
        background: transparent;
        border-bottom: 1px solid #e0e0e0;
        border-left: none;
        border-right: none;
        border-top: none;
        color: #444;
        flex-grow: 1;
        font-family: inherit;
        font-size: inherit;
        margin-bottom: -8px;
        padding: 0 0 7px 0;
        resize: none;
        z-index: 1;
      }
      .disabled .md-text-field-input {
        border-bottom: none;
        padding-bottom: 8px;
      }
      .md-text-field-container.md-text-field-no-label .md-text-field-input {
        //font-size: 16px;
      }

      .md-text-field-container.md-text-field-no-label {
        padding-top: 8px;
      }

      .md-text-field-borderless {
        border-bottom: none !important;
        padding-bottom: 8px;
      }

      .md-text-field-input:focus {
        border-bottom: 2px solid #4285f4;
        padding: 0 0 6px 0;
        outline: none;
      }
      .md-text-field-label-offset {
        font-size: 85%;
        top: 8px;
      }
    */},
    function toHTML() {/*
      <%
        var input = this.inputId = this.nextID();
        var label = this.labelId = this.nextID();

        this.on('focus',   this.onFocus,   input);
        this.on('blur',    this.onBlur,    input);
        this.on('input',   this.onInput,   input);
        this.on('change',  this.onChange,  input);
        this.on('click',   this.onClick,   input);
        this.on('keydown', this.onKeyDown, input);

        if ( this.floatingLabel ) {
          this.setClass('md-text-field-label-offset',
            function() {
              var focused = self.focused;
              var data    = self.data;
              return focused || ('' + data).length > 0;
            }, label);
        }

        this.setMDClasses();
      %>
      <div <%= this.cssClassAttr() %> id="%%id">
        <% if (this.floatingLabel) { %>
          <label id="{{{label}}}" class="md-text-field-label">%%label</label>
        <% } %>
        <% if ( this.growable ) { %>
          <div id="{{{input}}}" class="md-text-field-input"<%= this.mode == 'read-write' ? ' contenteditable' : '' %>>
          </div>
        <% } else if ( this.displayHeight > 1 ) { %>
          <textarea id="{{{input}}}" type="text" class="md-text-field-input" rows="{{{this.displayHeight}}}"<%= this.mode == 'read-only' ? ' disabled' : '' %>></textarea>
        <% } else { %>
          <input id="{{{input}}}" type="text"
              class="md-text-field-input <%= this.underline ? '' : 'md-text-field-borderless' %>"
              <%= this.floatingLabel ? '' : 'placeholder="' + this.label + '"' %><%= this.mode == 'read-only' ? ' disabled' : '' %> />
          <% if ( this.clearAction ) { %>
            $$clear{ iconUrl: this.clearIcon }
          <% } %>
        <% } %>
      </div>
    */}
  ],

  actions: [
    {
      name: 'clear',
      label: '',
      iconUrl: 'images/ic_cancel_24dp.png',
      isAvailable: function() { return !! this.softData.length; },
      action: function() {
        this.softData = '';
      }
    }
  ],

  listeners: [
    {
      name: 'onFocus',
      code: function() {
        this.focused = true;
      }
    },
    {
      name: 'onBlur',
      code: function() {
        this.focused = false;
        if (this.growable) {
          // contenteditable doesn't fire onChange.
          this.data = this.softData;
        }
      }
    },
    {
      name: 'onInput',
      code: function() {
      }
    },
    {
      name: 'onChange',
      code: function() {
        this.data = this.softData;
      }
    },
    {
      name: 'onKeyDown',
      code: function() {
      }
    },
    {
      name: 'onClick',
      code: function() {
        this.$input.focus();
      }
    }
  ]
});
