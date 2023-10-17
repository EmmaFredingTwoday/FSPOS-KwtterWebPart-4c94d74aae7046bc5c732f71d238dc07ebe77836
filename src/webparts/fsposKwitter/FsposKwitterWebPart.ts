import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';

import * as config from 'FsposKwitterWebPartStrings';
import FsposKwitter from './components/FsposKwitter';
import { IFsposKwitterProps } from './components/IFsposKwitterProps';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
initializeIcons();

import { BaseClientSideWebPart, WebPartContext } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import "@pnp/sp/webs";
import { SPFx, spfi, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/lists/web";
import "@pnp/sp/items/list";
import "@pnp/sp/batching";
import { LogLevel, PnPLogging } from "@pnp/logging";
import { getSP } from './pnpjsConfig';


var _sp: SPFI; 

export const getSp = (context?: WebPartContext): SPFI => {
  if(_sp === null && context != null) {
    _sp = spfi().using(SPFx(context)).using(PnPLogging(LogLevel.Warning));
  }

  return _sp;
};

export interface IFsposKwitterWebPartProps {
  listName: string;
  showAll: boolean;
  user: any;
}

export default class FsposKwitterWebPart extends BaseClientSideWebPart<IFsposKwitterWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const user = this.context.pageContext.user;
    const element: React.ReactElement<IFsposKwitterProps> = React.createElement(
      FsposKwitter,
      {
        currentUser: user,
        listName: this.properties.listName,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        showAll: this.properties.showAll,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
      //Initialize our _sp object that we can then use in other packages without having to pass around the context.
	  // Check out pnpjsConfig.ts for an example of a project setup file.
	  getSP(this.context);

    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? config.AppLocalEnvironmentOffice : config.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? config.AppLocalEnvironmentOutlook : config.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? config.AppLocalEnvironmentTeams : config.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = config.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? config.AppLocalEnvironmentSharePoint : config.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: config.PropertyPaneDescription
          },
          groups: [
            {
              groupName: config.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: config.ListNameFieldLabel
                }),
                PropertyPaneToggle('showAll', {
                  label: config.ShowAllFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
