import React, { useRef, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/getTrad';
import SettingsAPI from '../../../api/settings/settings-api-wrapper';
import { Stack } from '@strapi/design-system/Stack';
import { Main } from '@strapi/design-system/Main';
import { ContentLayout } from '@strapi/design-system/Layout';
import { Box } from '@strapi/design-system/Box';
import { H2 } from '@strapi/design-system/Text';
import { Button } from '@strapi/design-system/Button';
import Check from '@strapi/icons/Check';
import { HeaderLayout } from '@strapi/design-system/Layout';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { NumberInput } from '@strapi/design-system/NumberInput';
import Cog from '@strapi/icons/Cog';
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useNotification,
} from '@strapi/helper-plugin';
import { ToggleInput } from '@strapi/design-system/ToggleInput';
import { version as packageVersion } from '../../../../../package.json';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState();
  const toggleNotification = useNotification();

  const enableResetBtn=false;/* #5195 - use to enable reset BTN */

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
    if (settings.seo.navigationTimeout < 2 || settings.seo.navigationTimeout > 10) {
      toggleNotification({
        type: 'warning',
        message: { id: getTrad("plugin.settings.button.save.error") },
      });
      return;
    }

    setIsSaving(true);
    const data = await SettingsAPI.set(settings);
    console.log("settings saved", data);
    setSettings(data);
    setIsSaving(false);
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
          title={`${formatMessage({ id: getTrad("plugin.seo.title") })} - ${formatMessage({ id: getTrad("plugin.settings.expert.title") })}`}
          subtitle={formatMessage({ id: getTrad("plugin.settings.version") }, { version: packageVersion })}
          primaryAction={
            isLoading ? <></> :
            <Button onClick={handleSubmit} startIcon={<Check />} size="L" disabled={isSaving} loading={isSaving}>
              {formatMessage({ id: getTrad("plugin.settings.button.save.label") })}
            </Button>
          }
          /* #5195 - enable reset btn if enableResetBtn is true - BEGIN  */
          secondaryAction={(enableResetBtn?
            <Button variant="tertiary" onClick={handleReset} startIcon={<Cog />}>
              {"Reset"}
            </Button> :"")
          }
          /* #5195 - END  */
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
                      id: getTrad("plugin.settings.expert.title")
                    })}
                  </H2>
                  <Grid gap={6}>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        checked={settings?.seo?.clickToFind ?? true}
                        hint={ formatMessage({ id: getTrad("plugin.settings.expert.clickToFind.descr") }) }
                        label={ formatMessage({ id: getTrad("plugin.settings.expert.clickToFind") }) }
                        name="clickToFindEnabled"
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
                              seo: { ...prevState.seo, clickToFind: e.target.checked }
                            }
                          });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <NumberInput
                        name="navigationTimeout"
                        hint={ formatMessage({ id: getTrad("plugin.settings.expert.navigationTimeout.descr") }) }
                        label={ formatMessage({ id: getTrad("plugin.settings.expert.navigationTimeout") }) }
                        value={settings?.seo?.navigationTimeout ?? 2}
                        error={ settings?.seo?.navigationTimeout < 2 || settings?.seo?.navigationTimeout > 10
                          ? formatMessage({ id: getTrad("plugin.settings.expert.navigationTimeout.error") })
                          : null}
                        onValueChange={(value) => {
                          setSettings((prevState) => {
                            return {
                              ...prevState,
                              seo: { ...prevState.seo, navigationTimeout: value }
                            }
                          });
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