/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {Node} from '../tree/Node.js';
import fs from 'fs';
import {Dsl} from '../Dsl.js';
import xmldom from 'xmldom';
import {Config} from '../Config.js';
import {DomHelper} from '../../util/DomHelper.js';
import {EditScript} from '../diff/EditScript.js';
import {Logger} from '../../util/Logger.js';

export class Preprocessor {

  parseFromFile(path) {
    return this.parseWithMetadata(fs.readFileSync(path).toString());
  }

  parseWithMetadata(xml) {
    const endpointToUrl = new Map();
    const dataElements = new Map();

    //skip comments and processing instructions
    const root = DomHelper.firstChildElement(new xmldom.DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ''),
        'text/xml'));

    let tree;
    if (root == null) {
      return new Node(Dsl.ELEMENTS.ROOT.label);
    }
    if (root.localName === Dsl.XML_DOC.PROPERTIES_ROOT) {

      //Parse process tree
      const xmlDslx = DomHelper.firstChildElement(root, Dsl.XML_DOC.DSLX);
      const xmlDescription = DomHelper.firstChildElement(xmlDslx, Dsl.ELEMENTS.ROOT.label);
      tree = Node.fromXml(xmlDescription, true);

      //Parse endpoints
      const xmlEndpoints = DomHelper.firstChildElement(root, Dsl.XML_DOC.ENDPOINTS);
      DomHelper.forAllChildElements(xmlEndpoints, (xmlEndpoint) => {
        endpointToUrl.set(xmlEndpoint.localName, xmlEndpoint.firstChild.data);
      });

      //Parse initial values for data elements
      const xmlDataElements = DomHelper.firstChildElement(root, Dsl.XML_DOC.DATA_ELEMENTS);
      DomHelper.forAllChildElements(xmlDataElements, (xmlDataElement) => {
        dataElements.set(xmlDataElement.localName, xmlDataElement.firstChild.data);
      });

    } else {
      //hop straight into tree parsing
      tree = Node.fromXml(root, true);
    }

    return this.prepareTree(tree, endpointToUrl, dataElements);
  }

  prepareTree(tree, endpointToUrl = new Map(), dataElements = new Map(), editScript = new EditScript()) {
    //traverse tree in post-order (bottom-up)
    for (const node of tree.toPostOrderArray()) {
      let updated = false;
      let deleted = false;

      //only preserve semantically relevant attributes
      for (const key of node.attributes.keys()) {
        if (node.attributes.get(key) === '') {
          node.attributes.delete(key);
          updated = true;
        } else {
          //trim attribute value
          const val = node.attributes.get(key);
          const trimmedVal = val.trim();
          //TODO trim ends of newlines
          if (trimmedVal !== val) {
            node.attributes.set(key, trimmedVal);
            updated = true;
          }
        }
      }
      //replace endpoint identifier with actual URL
      if (node.attributes.has(Dsl.CALL_PROPERTIES.ENDPOINT.label)) {
        const endpoint = node.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label);
        //replace endpoint identifier with actual endpoint URL (if it exists)
        if (endpointToUrl.has(endpoint)) {
          node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, endpointToUrl.get(endpoint));
          updated = true;
        }
      } else if (node.label === Dsl.ELEMENTS.CALL.label) {
        node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, Math.floor(Math.random * 1000000).toString()); //random endpoint
        updated = true;
      }

      //trim irrelevant nodes
      if (node.isPropertyNode() && node.isEmpty()
          || (node.isInnerNode() && !node.hasChildren() && !node.isRoot())
          || (node.label === Dsl.ELEMENTS.MANIPULATE.label) && (node.text == null || node.text === '')) {
        node.removeFromParent();
        deleted = true;
      }

      //trim data
      if (node.text != null) {
        let newText = node.text.trim();
        if (newText !== node.text) {
          node.text = newText;
          updated = true;
        }
      }

      if (deleted) {
        editScript?.delete(node);
      } else if (updated) {
        editScript?.update(node);
      }
    }

    if (Config.ADD_INIT_SCRIPT && dataElements.size > 0) {
      //insert initializer for all declared variables at beginning of tree
      const script = new Node(Dsl.ELEMENTS.MANIPULATE.label);
      script.text = '';
      script.attributes.set('id', 'init');
      for (const [dataElement, initialValue] of dataElements) {
        script.text += Config.VARIABLE_PREFIX + dataElement + ' = ' + initialValue + ';';
      }
      tree.insertChild(0, script);

      editScript?.insert(script);
    }

    if (editScript.totalEditOperations() > 0) {
      Logger.warn('Document was modified during preprocessing, '
          + editScript.insertions() + ' insertions, ' +
          editScript.moves() + ' moves, ' +
          editScript.updates() + ' updates, ' +
          editScript.deletions() + ' deletions', this);
    }

    return tree;
  }
}