import React, { useRef, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/getTrad';
import SettingsAPI from '../../../api/settings/settings-api-wrapper';
import { Stack } from '@strapi/design-system/Stack';
import { Main } from '@strapi/design-system/Main';
import { ContentLayout } from '@strapi/design-system/Layout';
import { Box } from '@strapi/design-system/Box';
import { H2 } from '@strapi/design-system/Text';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import Plus from '@strapi/icons/Plus';
import { HeaderLayout } from '@strapi/design-system/Layout';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import Cog from '@strapi/icons/Cog';
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useNotification,
} from '@strapi/helper-plugin';
import { ToggleInput } from '@strapi/design-system/ToggleInput';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState();
  const toggleNotification = useNotification();

  //mount
  useEffect(() => {
    SettingsAPI.get().then((data) => {
      setSettings(data);
      setIsLoading(false);
    });
    // unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    const data = await SettingsAPI.set(settings);
    console.log("settings saved", data);
    setSettings(data);
    setIsLoading(false);
    toggleNotification({
      type: 'success',
      message: { id: getTrad("plugin.settings.button.save.message") },
    });
  };
  const handleReset = async () => {
    setSettings(await SettingsAPI.reset());
  };

  //TODO ADD the RBAC controls
  //<CheckPermissions permissions={permissions.createRole}>
  //</CheckPermissions>

  return (
    <>
      <Main labelledBy="title" aria-busy={isLoading}>
        <HeaderLayout
          id="title"
          title={formatMessage({ id: getTrad("plugin.settings.title") })}
          subtitle={formatMessage({ id: getTrad("plugin.settings.subtitle") })}
          primaryAction={
            <Button onClick={handleSubmit} startIcon={<Plus />} size="L" >
              {formatMessage({ id: getTrad("plugin.settings.button.save.label") })}
            </Button>
          }
          secondaryAction={
            <Button variant="tertiary" onClick={handleReset} startIcon={<Cog />}>
              {"Reset"}
            </Button>
          }
        >
        </HeaderLayout>
        {isLoading ? (<LoadingIndicatorPage />)
          : <ContentLayout>
            <form onSubmit={handleSubmit}>
              <Box
                background="neutral0"
                hasRadius
                shadow="filterShadow"
                paddingTop={6}
                paddingBottom={6}
                paddingLeft={7}
                paddingRight={7}
              >
                <Stack size={3}>
                  <H2>
                    {formatMessage({
                      id: getTrad("plugin.settings.panel.title")
                    })}
                  </H2>
                  <Grid gap={6}>
                    <GridItem col={12} s={12}>
                      <ToggleInput
                        checked={settings && settings.hasOwnProperty("seo") ? settings.seo.enabled : false}
                        hint={'Enable or disable the SEO module'}
                        label={'Enabled?'}
                        name="moduleEnabled"
                        offLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.off-label',
                          defaultMessage: 'Off',
                        })}
                        onLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.on-label',
                          defaultMessage: 'On',
                        })}
                        onChange={e => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, enabled: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem>
                    <GridItem col={12} s={12}>
                      <TextInput
                        label="Front-end URL to analyze"
                        name="siteURL"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontUrl: value }
                            }
                          });
                        }}
                        value={settings && settings.seo.frontUrl ? settings.seo.frontUrl : ""}
                        hint={'The URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={12} s={12}>
                      <ToggleInput
                        checked={settings && settings.hasOwnProperty("seo") ? settings.seo.expertMode : false}
                        hint={'Enable or disable analyze details expert mode'}
                        label={'Expert Mode (beta version)'}
                        name="expertModeEnabled"
                        offLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.off-label',
                          defaultMessage: 'Off',
                        })}
                        onLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.on-label',
                          defaultMessage: 'On',
                        })}
                        onChange={e => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, expertMode: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem>
                    {/* #5193 : disable enable option for primary frontend url
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        checked={settings && settings.hasOwnProperty("seo") ? settings.seo.frontEnabled : false}
                        hint={'Enable or disable the analyze of this frontend'}
                        label={'Enabled?'}
                        name="siteEnabled"
                        offLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.off-label',
                          defaultMessage: 'Off',
                        })}
                        onLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.on-label',
                          defaultMessage: 'On',
                        })}
                        onChange={e => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontEnabled: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem> */}
                    {/* #5193 : disable settings
                    <GridItem col={6} s={12}>
                      <TextInput
                        label="Second Front-end URL to analyze"
                        name="siteURL2"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontUrl2: value }
                            }
                          });
                        }}
                        value={settings && settings.seo.frontUrl2 ? settings.seo.frontUrl2 : ""}
                        hint={'The second URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        checked={settings && settings.hasOwnProperty("seo") ? settings.seo.frontEnabled2 : false}
                        hint={'Enable or disable the analyze of the second frontend'}
                        label={'Enabled?'}
                        name="siteEnabled2"
                        offLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.off-label',
                          defaultMessage: 'Off',
                        })}
                        onLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.on-label',
                          defaultMessage: 'On',
                        })}
                        onChange={e => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontEnabled2: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <TextInput
                        label="Third Front-end URL to analyze"
                        name="siteURL3"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontUrl3: value }
                            }
                          });
                        }}
                        value={settings && settings.seo.frontUrl3 ? settings.seo.frontUrl3 : ""}
                        hint={'The URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        checked={settings && settings.hasOwnProperty("seo") ? settings.seo.frontEnabled3 : false}
                        hint={'Enable or disable the analyze of the third frontend'}
                        label={'Enabled?'}
                        name="siteEnabled3"
                        offLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.off-label',
                          defaultMessage: 'Off',
                        })}
                        onLabel={formatMessage({
                          id: 'app.components.ToggleCheckbox.on-label',
                          defaultMessage: 'On',
                        })}
                        onChange={e => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, frontEnabled3: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem> */}
                  </Grid>
                </Stack>
              </Box>
            </form>
          </ContentLayout>
        }
      </Main>
    </>
  );
};

export default SettingsPage;