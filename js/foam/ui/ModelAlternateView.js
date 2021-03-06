/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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
  name: 'ModelAlternateView',
  extendsModel: 'foam.ui.AlternateView',

  methods: {
    init: function() {
      // TODO: super.init
      this.views = FOAM([
        {
          model_: 'foam.ui.ViewChoice',
          label:  'GUI',
          view:   'foam.ui.DetailView'
        },
        {
          model_: 'foam.ui.ViewChoice',
          label:  'JS',
          view:   'foam.ui.JSView'
        },
        {
          model_: 'foam.ui.ViewChoice',
          label:  'XML',
          view:   'XMLView'
        },
        {
          model_: 'foam.ui.ViewChoice',
          label:  'UML',
          view:   'XMLView'
        },
        {
          model_: 'foam.ui.ViewChoice',
          label:  'Split',
          view:   'SplitView'
        }
      ]);
    }
  }
});

