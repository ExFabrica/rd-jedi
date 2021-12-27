import React from 'react';
import SeoIcon from '@strapi/icons/Book';
import MediaIcon from '@strapi/icons/Landscape';
import GreenIcon from '@strapi/icons/Earth';
import {
  SubNav,
  SubNavHeader,
  SubNavSections,
  SubNavLink,
} from '@strapi/design-system/SubNav';
import pluginId from '../../../pluginId';

const AnalyzerNav = () => {
  const links = [{
    id: 1,
    label: 'SEO',
    icon: <SeoIcon />,
    to: `/plugins/${pluginId}/seo`
  }, {
    id: 2,
    label: 'Media',
    icon: <MediaIcon />,
    to: `/plugins/${pluginId}/media`
  }, {
    id: 3,
    label: 'Green CMS',
    icon: <GreenIcon />,
    to: `/plugins/${pluginId}/green`,
    active: true
  },
  ];

  return <SubNav ariaLabel="Builder sub nav">
    <SubNavHeader label="CMS Analyzer" />
    <SubNavSections>
      {links.map(link => <SubNavLink to={link.to} active={link.active} key={link.id} icon={link.icon} >
        {link.label}
      </SubNavLink>)}
    </SubNavSections>
  </SubNav>
}

export default AnalyzerNav;