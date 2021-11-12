import React, { useRef, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Header } from '@buffetjs/custom';
import { Button, Toggle, InputText, Label } from '@buffetjs/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import getTrad from '../../utils/getTrad';
import SettingsMiddleware from '../../middlewares/settings/ui-settings';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const isMounted = useRef(true);
  const [showLoader, setShowLoader] = useState(true);
  const [settings, setSettings] = useState();
  //mount
  useEffect(() => {
    SettingsMiddleware.get().then((data) => {
      setSettings(data);
      console.log('data', data);
      setShowLoader(false);
    });
    // unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async () => {
    setShowLoader(true);
    const data = await SettingsMiddleware.set(settings);
    setSettings(data);
    setShowLoader(false);
    strapi.notification.success(formatMessage({ id: getTrad("plugin.settings.button.save.message") }));
  }

  return (
    <>
      <div className="row">
        <div className="col-6">
          <Header
            title={{ label: formatMessage({ id: getTrad("plugin.settings.title") }) }}
            content={formatMessage({ id: getTrad("plugin.settings.subtitle") })}
            isLoading={showLoader}
          />
        </div>
        <div className="col-6" style={{ textAlign: 'right' }}>
          <Button color="primary" onClick={handleSubmit} icon={<FontAwesomeIcon icon={faPlus} />} label={formatMessage({ id: getTrad("plugin.settings.button.save.label") })} />
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          title={formatMessage({ id: getTrad("plugin.settings.panel.title") })}
          isLoading={showLoader}
        >
          <div className="col-12 row">
            <div className="col-12">
              <Label htmlFor="default-string" message={formatMessage({ id: getTrad("plugin.settings.panel.setting1.label") })} />
              <InputText
                label="Label"
                name="default-string"
                placeholder={formatMessage({ id: getTrad("plugin.settings.panel.setting1.placeholder") })}
                onChange={({ target: { value } }) => {
                  setSettings((prevState) => {
                    return { ...prevState, frontUrl: value };
                  });
                }}
                value={settings && settings.frontUrl ? settings.frontUrl : ""}
              />
            </div>
            {/*<div className="col-6">
              <Label htmlFor="default-number" message={formatMessage({ id: getTrad("plugin.settings.panel.setting3.label") })} />
              <InputNumber
                label="Label"
                name="default-number"
                onChange={({ target: { value } }) => {
                  setSettings((prevState) => {
                    return { ...prevState, setting3: value };
                  });
                }}
                value={settings && settings.setting3 ? settings.setting3 : 0}
              />
              </div>*/}
          </div>
          <div className="col-12 row" style={{ marginTop: "20px" }}>
            <div className="col-6">
              <Label htmlFor="default-toggle" message={formatMessage({ id: getTrad("plugin.settings.panel.setting2.label") })} />
              <Toggle
                name="default-toggle"
                onChange={({ target: { value } }) => {
                  setSettings((prevState) => {
                    return { ...prevState, enabled: value };
                  });
                }}
                value={settings && settings.enabled ? settings.enabled : false}
              />
            </div>
            <div className="col-6">
            </div>
          </div>
          <div className="col-12 row" style={{ marginTop: "20px" }}>
          </div>
        </div>
      </form>
    </>
  );
};

export default SettingsPage;