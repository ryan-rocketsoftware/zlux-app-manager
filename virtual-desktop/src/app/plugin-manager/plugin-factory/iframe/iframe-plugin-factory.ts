

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import { Compiler, Component, Injectable, NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PluginFactory } from '../plugin-factory';
//import { DesktopPluginDefinition } from '../../shared/desktop-plugin-definition';
import { CompiledPlugin } from '../../shared/compiled-plugin';
import { BaseLogger } from 'virtual-desktop-logger';

var dragOn = false;
var mouseDown = false;
let iFrameElement: HTMLElement;

@Injectable()
export class IFramePluginFactory extends PluginFactory {
  private readonly logger: ZLUX.ComponentLogger = BaseLogger;
  constructor(
    private compiler: Compiler,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  static iframeIndex:number = 1;

  acceptableFrameworks(): string[] {
      return ['iframe'];
    }

  private createIFrameComponentClass(pluginDefinition: MVDHosting.DesktopPluginDefinition): Type<any> {
    const basePlugin = pluginDefinition.getBasePlugin();
    const startingPage = basePlugin.getWebContent().startingPage || 'index.html';
    this.logger.debug('iframe startingPage', startingPage);
    let startingPageUri;
    if (startingPage.startsWith('http://') || startingPage.startsWith('https://')) {
      startingPageUri = startingPage;
    } else {
      startingPageUri = (window as any).ZoweZLUX.uriBroker.pluginResourceUri(basePlugin, startingPage);
    }
    this.logger.debug('iframe startingPageUri', startingPageUri);
    const safeStartingPageUri: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(startingPageUri);
    this.logger.info(`Loading iframe, URI=${startingPageUri}`);
    const theIframeId = "mvd_iframe_"+(IFramePluginFactory.iframeIndex++);
    return class IFrameComponentClass {
      startingPage: SafeResourceUrl = safeStartingPageUri;
      iframeId:string = theIframeId;
      iFrameMouseOver(event: any) {
        iFrameElement = event.target;
        if(dragOn) {
          event.target.style.pointerEvents = "none";
        }
        else {
          event.target.style.pointerEvents = "auto";
        }
      }
    };
  }

  loadComponentFactories(pluginDefinition: MVDHosting.DesktopPluginDefinition): Promise<void> {
    this.logger.info(`IFrame component factories currently unsupported. `
                    +`Skipping for plugin ID=${pluginDefinition.getIdentifier()}`);

    return Promise.resolve();
  }

  loadPlugin(pluginDefinition: MVDHosting.DesktopPluginDefinition): Promise<CompiledPlugin> {
    const componentClass = this.createIFrameComponentClass(pluginDefinition);
    const metadata = {
      selector: 'rs-com-mvd-iframe-component',
      templateUrl: './iframe-plugin.component.html',
      styleUrls: ['./iframe-plugin.component.css']
    };
    const decoratedComponent = Component(metadata)(componentClass);
    @NgModule({
      imports: [CommonModule],
      declarations: [decoratedComponent],
      entryComponents: [decoratedComponent]
    })
    class RuntimePluginModule {}
    return this.compiler.compileModuleAsync(RuntimePluginModule).then(factory =>
      new CompiledPlugin(decoratedComponent, factory)
    );
  }
}

window.addEventListener("mousedown", (event) => {
  mouseDown = true;
  setTimeout( () => {
    if (mouseDown == true){
      dragOn = true;
      if (iFrameElement != null) {
        iFrameElement.style.pointerEvents = "none";
      }
    } else {
      dragOn = false;
    }
  }, 100)
}, false);
window.addEventListener("mouseup", (event) => {
  mouseDown = false;
  dragOn = false;
  if (iFrameElement != null) {
    iFrameElement.style.pointerEvents = "auto";
  }
}, false);

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

