/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

// Replace the RichTextView labels with icons.
// TODO: move this to RichTextView.js as the default.
RichTextView.BOLD.iconUrl      = '/images/bold.svg';
RichTextView.ITALIC.iconUrl    = '/images/italics.svg';
RichTextView.UNDERLINE.iconUrl = '/images/underline.svg';
RichTextView.LINK.iconUrl      = '/images/insert_link.svg';
RichTextView.BOLD.label        = '';
RichTextView.ITALIC.label      = '';
RichTextView.UNDERLINE.label   = '';
RichTextView.LINK.label        = '';

var AttachmentView = FOAM({
  model_: 'Model',
  extendsModel: 'AbstractView',

  name: 'AttachmentView',

  properties: [
    {
      name:  'value',
      type:  'Value',
      valueFactory: function() { return SimpleValue.create(); },
      postSet: function(value) {
        value.addListener(this.redraw.bind(this));
      }
    }
  ],

  listeners: [
    {
      model_: 'Method',
      name: 'onRemove',
      code: function(attr) {
        this.value.set(this.value.get().removeF(EQ(Attachment.ID, attr.id)));
      }
    }
  ],

  methods: {
    // TODO: deprecate and remove
    setValue: function(value) {
      this.value = value;
    },

    toHTML: function() {
      return '<div id="' + this.getID() + '" class="attachments"></div>';
    },

    initHTML: function() {
      // this.SUPER();

      this.value = this.value;
      // this.value.addListener(this.redraw.bind(this));
      this.redraw();
    },

    toInnerHTML: function() {
      this.$.style.display = this.value.get().length ? 'block' : 'none';

      var out = "";

      for ( var i = 0 ; i < this.value.get().length ; i++ ) {
        var att = this.value.get()[i];
        var size = '(' + Math.round(att.size/1000).toLocaleString() + 'k)';
        out += '<div class="attachment"><div class="filenameandsize"><span class="filename">' + this.strToHTML(att.filename) + '</span><span class="size">' + size + '</span></div><span class="spacer"/><span class="remove"><button id="' + this.on('click', this.onRemove.bind(this, att)) + '" tabindex="99"><img src="images/x_8px.png"></button></span></div>';
      }

      return out;
    },

    redraw: function() {
      this.$.innerHTML = this.toInnerHTML();
      this.registerCallbacks();
    }
  }
});


var QuickEMail = FOAM({
  model_: 'Model',
  extendsModel: 'EMail',
  name: 'QuickEMail',
  properties: [
    {
      name: 'to',
      displayWidth: 55,
      view: {
        // TODO: Fetch this dependencies via context.
        create: function(prop) {
          return ListValueView.create({
            inputView: ListInputView.create({
              name: prop.name,
              dao: ContactAvatarDAO,
              property: Contact.EMAIL,
              placeholder: 'To',
              searchProperties: [Contact.EMAIL, Contact.FIRST, Contact.LAST, Contact.TITLE],
              autocompleteView: AutocompleteListView.create({
                innerView: ContactListTileView,
                count: 8
              })
            }),
            valueView: ArrayTileView.create({
              dao: DefaultObjectDAO.create({
                delegate: ContactAvatarDAO,
                factory: function(q) {
                  var obj = Contact.create({});
                  obj[q.arg1.name] = q.arg2.arg1;
                  return obj;
                }
              }),
              property: Contact.EMAIL,
              tileView: ContactSmallTileView
            })
          });
        }
      }
    },
    { name: 'subject',     displayWidth: 55, view: { model_: 'TextFieldView', placeholder: 'Subject', onKeyMode: true } },
    { name: 'attachments', view: 'AttachmentView' },
    { name: 'body',        view: { model_: 'RichTextView', height: 100, onKeyMode: true, placeholder: 'Message' } }
  ]
});


var QuickEMailView = Model.create({
  name: 'QuickEMailView',

  extendsModel: 'DetailView',

  templates: [
    {
      name: "toHTML",
      template: '$$to $$subject $$body $$attachments'
    }
  ]
});


var QuickCompose = FOAM({
  model_: 'Model',

  name: 'QuickCompose',

  extendsModel: 'AbstractView',

  properties: [
    {
      name: 'window'
    },
    {
      name: 'userInfo'
    },
    {
      name: 'email',
      valueFactory: function() {
        // TODO: Look for a draft in the EMailDAO
        return QuickEMail.create({from: this.userInfo.email, id: Date.now()});
      }
    },
    {
      name: 'view',
      valueFactory: function() {
        return QuickEMailView.create({
          model: QuickEMail
        });
      }
    },
    {
      name: 'minimizeButton',
      valueFactory: function() { return ActionButton.create({action: this.model_.MINIMIZE, value: SimpleValue.create(this)}); }
    },
    {
      name: 'closeButton',
      valueFactory: function() { return ActionButton.create({action: this.model_.CLOSE, value: SimpleValue.create(this)}); }
    },
    {
      name: 'EMailDAO',
      defaultValueFn: function() { return EMailDAO; }
    },
    {
      name: 'ContactDAO',
      defaultValueFn: function() { return ContactDAO; }
    }
  ],

  methods: {
    initHTML: function() {
      this.view.value = this.propertyValue('email');

      this.SUPER();

      this.closeButton.$.tabIndex = -1;
      this.minimizeButton.$.tabIndex = -1;

      this.view.bodyView.subscribe('attachmentAdded', this.addAttachment);

      // Remove images when their attachments are removed.
      this.email.propertyValue('attachments').addListener(function(_, _, oldAtts, newAtts) {
         for ( var i = 0 ; i < oldAtts.length ; i++ ) {
           var a = oldAtts[i];
           newAtts.find(a.id, {error: function() {
             this.view.bodyView.removeImage(a.id);
           }.bind(this)});
         }
      }.bind(this));

      this.window.document.addEventListener('keyup', this.keyUp);
      this.view.bodyView.$.contentDocument.addEventListener('keyup', this.keyUp);

      this.window.document.addEventListener('keypress', this.keyPress);
      this.view.bodyView.$.contentDocument.addEventListener('keypress', this.keyPress);
      
      this.view.toView.inputView.$.focus();
    }
  },

   actions: [
     {
       model_: 'Action',
       name:  'send',
       help:  'Send (Ctrl-Enter)',

       isEnabled: function(obj) {
         var email   = obj.email;
         var length  = email.to.length;
         var subject = email.subject;
         var body    = email.body;
         return length && ( subject || body );
       },
       action: function() {
         this.email.timeStamp = new Date();
         this.EMailDAO.put(this.email);
         this.window.close();
       }
     },
     {
       model_: 'Action',
       name:  'discard',
       label: '',
       iconUrl: '/images/trash.svg',
       help:  'Discard draft',

       action: function() {
         this.email.to = [];
         this.email.subject = '';
         this.email.body = '';
         this.email.attachments = [];

         // This is required rather than just calling this.close() because
         // DOM updates don't appear to work once the window is minimized.
         EventService.animate(EventService.animate(this.close.bind(this)))();
       }
     },
     {
       model_: 'Action',
       name:  'close',
       label: '',
       iconUrl: 'images/window_control_icon_flat_close.png',
       // help:  'Discard & Close',

       action: function() {
         this.appWindow.close();
       }
     },
     {
       model_: 'Action',
       name:  'minimize',
       label: '',
       iconUrl: 'images/window_control_icon_flat_minimize.png',
       // help:  'Minimize',

       action: function() {
         this.appWindow.minimize();
       }
     }

   ],

   listeners: [
      {
        model_: 'Method',
         name: 'addAttachment',
         code: function(_, _, file, id) {
           console.log('add attachment: ', file);
           var att = Attachment.create({
             id:       id,
             file:     file,
             filename: file.name,
             type:     file.type,
             size:     file.size
           });
           console.log(att);
           this.email.attachments = this.email.attachments.concat(att);
         }
      },
      {
        model_: 'Method',
        name: 'keyUp',
        code: function(e) {
          if ( e.shiftKey && e.ctrlKey ) {
            var action = {
               55: RichTextView.NUMBERED_LIST,
               56: RichTextView.BULLET_LIST,
              219: RichTextView.DECREASE_INDENTATION,
              221: RichTextView.INCREASE_INDENTATION,
               57: RichTextView.BLOCK_QUOTE,
               87: RichTextView.LEFT_JUSTIFY,
               69: RichTextView.CENTER_JUSTIFY,
               82: RichTextView.RIGHT_JUSTIFY,
               48: RichTextView.REMOVE_FORMATTING
            }[e.keyCode];

            if ( action ) action.action.apply(this.view.bodyView);
          }
          if ( e.keyCode == 27 /* Esc */ ) this.minimize();
        }
      },
      {
        model_: 'Method',
        name: 'keyPress',
        code: function(e) {
          if ( e.ctrlKey && e.keyCode == 10 /* Ctrl-Enter */ ) this.send();
          if ( e.ctrlKey && e.keyCode == 11 /* Ctrl-K     */ ) RichTextView.LINK.action.call(this.view.bodyView);
        }
      }
   ],

  templates: [
    {
      name: "toHTML",
      template: "<head><link rel=\"stylesheet\" type=\"text/css\" href=\"foam.css\" /><link rel=\"stylesheet\" type=\"text/css\" href=\"quickcompose.css\" /><link rel=\"stylesheet\" type=\"text/css\" href=\"contacts.css\" /><title>Quick Message</title></head><body><% this.header(out); %>%%view <% this.toolbar(out); %></body>"
    },
    {
      name: "header",
      template: "<div id=\"header\">%%minimizeButton %%closeButton</div>"
    },
    {
      name: "toolbar"
    }
  ]
});
