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

/**
 * Helper class to navigate DOM objects.
 */
export class DomHelper {

  static XML_NODE_TYPES = {
    ELEMENT: 1,
    TEXT: 3
  };

  static firstChildElement(xmlParent, localName = null) {
    let xmlChild = xmlParent?.firstChild;
    while (xmlChild != null && (xmlChild.nodeType !== this.XML_NODE_TYPES.ELEMENT || (localName != null && xmlChild.localName !== localName))) {
      xmlChild = xmlChild.nextSibling;
    }
    return xmlChild;
  }

  static forAllChildElements(xmlParent, func) {
    if (xmlParent == null) return;
    for (let i = 0; i < xmlParent.childNodes.length; i++) {
      const xmlChild = xmlParent.childNodes.item(i);
      if (xmlChild.nodeType === 1) {
        func(xmlChild);
      }
    }
  }
}

