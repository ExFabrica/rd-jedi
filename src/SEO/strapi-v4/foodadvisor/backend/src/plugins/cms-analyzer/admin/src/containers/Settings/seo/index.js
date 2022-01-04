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
      console.log('data', data);
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

    console.log(data);
    setSettings(data);
    setIsLoading(false);
    toggleNotification({
      type: 'success',
      message: { id: getTrad("plugin.settings.button.save.message") },
    });
  }

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
                    <GridItem col={6} s={12}>
                      <TextInput
                        label="Front-end URL to analyze"
                        name="siteURI"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return { ...prevState, frontUrl: value };
                          });
                        }}
                        value={settings && settings.frontUrl ? settings.frontUrl : ""}
                        hint={'The URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="crawling"
                        data-testid="crawling"
                        checked={settings && settings.hasOwnProperty("enabled") ? settings.enabled : false}
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
                          setSettings({ ...settings, enabled: e.target.checked });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <TextInput
                        label="Second Front-end URL to analyze"
                        name="siteURI2"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return { ...prevState, frontUrl2: value };
                          });
                        }}
                        value={settings && settings.frontUrl2 ? settings.frontUrl2 : ""}
                        hint={'The second URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="crawling"
                        data-testid="crawling"
                        checked={settings && settings.hasOwnProperty("enabled2") ? settings.enabled2 : false}
                        hint={'Enable or disable the analyze of the second front-end url'}
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
                          setSettings({ ...settings, enabled2: e.target.checked });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <TextInput
                        label="Third Front-end URL to analyze"
                        name="siteURI3"
                        placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                        onChange={({ target: { value } }) => {
                          setSettings((prevState) => {
                            return { ...prevState, frontUrl3: value };
                          });
                        }}
                        value={settings && settings.frontUrl3 ? settings.frontUrl3 : ""}
                        hint={'The third URL of the frontend you want to analyze'}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="crawling"
                        data-testid="crawling"
                        checked={settings && settings.hasOwnProperty("enabled3") ? settings.enabled3 : false}
                        hint={'Enable or disable the analyze of the third front-end url'}
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
                          setSettings({ ...settings, enabled3: e.target.checked });
                        }}
                      />
                    </GridItem>
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